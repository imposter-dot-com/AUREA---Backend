import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { GoogleGenAI } from '@google/genai';
import pdfExtract from 'pdf-text-extract';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables only if not already loaded
if (!process.env.GEMINI_API_KEY) {
  dotenv.config();
}

const extractPDF = promisify(pdfExtract);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Google GenAI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Configure multer for PDF upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/pdfs');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `proposal-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Extract text directly from PDF using pdf-text-extract
const extractTextFromPDF = async (pdfPath) => {
  try {
    console.log('Extracting text from PDF:', pdfPath);
    
    // Extract text using pdf-text-extract
    const pages = await extractPDF(pdfPath, { splitPages: true });
    
    // Combine all pages into a single text
    const fullText = pages.join('\n--- Page Break ---\n');
    
    return {
      text: fullText.trim(),
      numPages: pages.length,
      info: {
        Title: 'PDF Document',
        Pages: pages.length
      },
      pages: pages // Individual page texts
    };
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF: ' + error.message);
  }
};

// Process extracted text with Google GenAI
const processTextWithGemini = async (extractedText) => {
  try {
    // Try different models - starting with gemini-2.5-pro
    const models = ['gemini-2.5-pro'];
    
    for (const modelName of models) {
      try {
        console.log(`Trying model: ${modelName}`);
        
        const response = await ai.models.generateContent({
          model: modelName,
          contents: `
          You are an AI assistant specialized in extracting structured information from client briefs and business documents for a Pricing Calculator Tool. 
          
          First, analyze the entire document and extract ALL available information. Then organize it into the following comprehensive JSON format:

          {
            "documentType": "string (e.g., 'client_brief', 'proposal', 'RFP', 'project_brief', etc.)",
            "documentTitle": "string",
            
            // FULL DOCUMENT ANALYSIS - Extract ALL available information first
            "fullAnalysis": {
              "clientInformation": {
                "companyName": "string",
                "contactPerson": "string",
                "email": "string",
                "phone": "string",
                "address": "string",
                "website": "string",
                "industry": "string"
              },
              "projectDetails": {
                "projectName": "string",
                "projectType": "string",
                "description": "string",
                "objectives": "array of strings",
                "scope": "array of strings",
                "features": "array of strings",
                "technologies": "array of strings",
                "platforms": "array of strings"
              },
              "requirements": {
                "functional": "array of strings",
                "technical": "array of strings",
                "design": "array of strings",
                "performance": "array of strings",
                "security": "array of strings",
                "integrations": "array of strings"
              },
              "timeline": {
                "startDate": "string (YYYY-MM-DD)",
                "endDate": "string (YYYY-MM-DD)",
                "deadline": "string (YYYY-MM-DD)",
                "milestones": "array of objects with {milestone: string, date: string}",
                "phases": "array of strings"
              },
              "budget": {
                "mentioned": "boolean",
                "amount": "number",
                "currency": "string",
                "range": "string",
                "breakdown": "array of objects with {item: string, amount: number}",
                "paymentTerms": "string"
              },
              "deliverables": "array of strings",
              "constraints": "array of strings",
              "assumptions": "array of strings",
              "risks": "array of strings"
            },

            // PRICING CALCULATOR SPECIFIC EXTRACTION - Key information for pricing
            "pricingCalculatorData": {
              "requirements": {
                "specified": "boolean",
                "functional": "array of strings - specific functional requirements",
                "technical": "array of strings - technical specifications", 
                "features": "array of strings - required features",
                "complexity": "string (low/medium/high/enterprise)"
              },
              "projectOverview": {
                "summary": "string - concise project summary for pricing",
                "type": "string (web_app, mobile_app, api, website, etc.)",
                "scale": "string (small/medium/large/enterprise)",
                "industry": "string",
                "targetAudience": "string"
              },
              "deadlineDelivery": {
                "hasDeadline": "boolean",
                "deadline": "string (YYYY-MM-DD) - final delivery date",
                "urgency": "string (flexible/standard/urgent/critical)",
                "timeframe": "string - estimated duration",
                "phases": "array of strings - delivery phases"
              },
              "budgetInfo": {
                "mentioned": "boolean",
                "estimatedRange": "string",
                "exactAmount": "number",
                "currency": "string",
                "budgetType": "string (fixed/range/not_specified)",
                "constraints": "string"
              },
              "clientProjectInfo": {
                "clientName": "string",
                "projectName": "string", 
                "contactInfo": "string",
                "companySize": "string (startup/small/medium/large/enterprise)",
                "previousProjects": "boolean",
                "referenceProjects": "array of strings"
              }
            },

            "extractionMetadata": {
              "confidence": "number (0-1) - confidence in extraction accuracy",
              "completeness": "number (0-1) - how complete the information is",
              "keyMissingInfo": "array of strings - important missing information",
              "extractedAt": "${new Date().toISOString()}"
            }
          }

          CRITICAL INSTRUCTIONS:
          1. Extract ALL information available in the document first (fullAnalysis section)
          2. Then specifically identify and organize the pricing calculator requirements
          3. Focus especially on: Requirements, Project Overview, Deadline/Delivery, Budget, Client Info
          4. If information is not available, use null for that field
          5. Be very thorough in identifying project requirements and scope
          6. Return only valid JSON without any additional text or formatting
          7. Pay special attention to timeline/deadline information for pricing urgency
          8. Identify budget constraints or mentions that affect pricing strategy

          Document Text:
          ${extractedText.substring(0, 35000)} // Increased limit for comprehensive analysis
          `
        });

        const text = response.text;
        console.log(`✅ Successfully used model: ${modelName}`);
        
        // Try to parse JSON from the response
        try {
          // Clean the response text to extract JSON
          let jsonText = text.trim();
          
          // Remove markdown code blocks if present
          jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
          
          // Extract JSON object
          const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const extractedData = JSON.parse(jsonMatch[0]);
            return {
              success: true,
              data: extractedData,
              rawResponse: text,
              modelUsed: modelName
            };
          } else {
            return {
              success: false,
              data: null,
              rawResponse: text,
              error: 'No JSON found in GenAI response',
              modelUsed: modelName
            };
          }
        } catch (parseError) {
          console.error('JSON parsing error:', parseError);
          return {
            success: false,
            data: null,
            rawResponse: text,
            error: 'Failed to parse JSON from GenAI response: ' + parseError.message,
            modelUsed: modelName
          };
        }
        
      } catch (modelError) {
        console.log(`❌ Failed with model ${modelName}:`, modelError.message);
        if (modelName === models[models.length - 1]) {
          // Last model failed, throw error
          throw modelError;
        }
        // Continue to next model
        continue;
      }
    }

    throw new Error('All models failed to generate content');
    
  } catch (error) {
    console.error('Error processing text with GenAI:', error);
    throw new Error('Failed to process text with Google GenAI: ' + error.message);
  }
};

// Enhance extracted data with additional processing
const enhanceExtractedData = (geminiResult, pdfMetadata) => {
  const enhancedData = {
    extractionMetadata: {
      extractionMethod: 'direct-pdf-text',
      aiModel: geminiResult.modelUsed || 'unknown',
      success: geminiResult.success,
      extractedAt: new Date().toISOString(),
      pdfInfo: {
        pages: pdfMetadata.numPages,
        title: pdfMetadata.info?.Title || null,
        author: pdfMetadata.info?.Author || null,
        creator: pdfMetadata.info?.Creator || null,
        creationDate: pdfMetadata.info?.CreationDate || null,
        modificationDate: pdfMetadata.info?.ModDate || null
      }
    },
    extractedData: geminiResult.data,
    rawPdfText: pdfMetadata.text,
    processingNotes: geminiResult.error ? [geminiResult.error] : []
  };

  // Add text statistics
  if (pdfMetadata.text) {
    enhancedData.extractionMetadata.textStats = {
      totalCharacters: pdfMetadata.text.length,
      totalWords: pdfMetadata.text.split(/\s+/).length,
      totalLines: pdfMetadata.text.split('\n').length
    };
  }

  return enhancedData;
};

// Main controller function
export const extractProposalData = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Gemini API key is not configured'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file uploaded'
      });
    }

    const pdfPath = req.file.path;
    console.log('Processing PDF:', req.file.originalname);
    
    // Extract text directly from PDF
    console.log('Extracting text from PDF...');
    const pdfData = await extractTextFromPDF(pdfPath);
    console.log(`Extracted text from ${pdfData.numPages} pages`);
    
    // Process the extracted text with Google GenAI
    console.log('Processing text with Google GenAI...');
    const geminiResult = await processTextWithGemini(pdfData.text);
    
    // Enhance the extracted data with metadata
    const enhancedData = enhanceExtractedData(geminiResult, pdfData);
    
    // Clean up uploaded PDF
    await fs.unlink(pdfPath).catch(console.error);
    
    res.status(200).json({
      success: true,
      message: 'PDF processed successfully',
      data: enhancedData,
      metadata: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        processedAt: new Date().toISOString(),
        userId: req.user?._id || 'anonymous', // From authentication middleware (optional)
        extractionSuccess: geminiResult.success
      }
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    
    // Clean up files in case of error
    if (req.file && req.file.path) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to process PDF',
      error: error.message,
      details: error.stack
    });
  }
};

// Get extraction history (placeholder for now)
export const getExtractionHistory = async (req, res) => {
  try {
    // This would typically fetch from a database
    // For now, return empty array with user info
    res.status(200).json({
      success: true,
      data: [],
      message: 'Extraction history retrieved successfully',
      userId: req.user?._id || 'anonymous'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve extraction history',
      error: error.message
    });
  }
};

// Test Google GenAI connection
export const testGeminiConnection = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Gemini API key is not configured'
      });
    }

    // Try different models to see which one works - starting with gemini-2.5-pro
    const models = ['gemini-2.5-pro'];
    const results = [];
    
    for (const modelName of models) {
      try {
        console.log(`Testing model: ${modelName}`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: "Say hello!"
        });
        
        const text = response.text;
        
        results.push({
          model: modelName,
          success: true,
          response: text,
          error: null
        });
        
        console.log(`✅ Model ${modelName} works!`);
      } catch (error) {
        console.log(`❌ Model ${modelName} failed:`, error.message);
        results.push({
          model: modelName,
          success: false,
          response: null,
          error: error.message
        });
      }
    }

    // Check if any model worked
    const workingModels = results.filter(r => r.success);
    
    res.status(200).json({
      success: workingModels.length > 0,
      message: workingModels.length > 0 
        ? `Google GenAI connection successful! ${workingModels.length} model(s) working.`
        : 'Google GenAI connection failed for all models',
      data: {
        results,
        workingModels: workingModels.map(r => r.model),
        apiKeyConfigured: true,
        library: '@google/genai',
        timestamp: new Date().toISOString(),
        userId: req.user?._id || 'anonymous'
      }
    });

  } catch (error) {
    console.error('Google GenAI test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Google GenAI connection failed',
      error: error.message,
      data: {
        apiKeyConfigured: !!process.env.GEMINI_API_KEY,
        library: '@google/genai',
        timestamp: new Date().toISOString()
      }
    });
  }
};