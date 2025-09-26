import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

// Process extracted text with Gemini AI - Two Step Method
const processTextWithGeminiTwoStep = async (extractedText) => {
  try {
    const models = ['gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'];
    let model, result, response, text;
    
    // STEP 1: Extract ALL information from the document
    console.log('🔍 STEP 1: Extracting ALL information from document...');
    
    for (const modelName of models) {
      try {
        console.log(`Trying model for Step 1: ${modelName}`);
        model = genAI.getGenerativeModel({ model: modelName });
        
        const step1Prompt = `
        You are an AI assistant specialized in comprehensive document analysis. 
        
        STEP 1: EXTRACT ALL INFORMATION - Analyze the entire document and extract EVERYTHING available.
        
        Organize ALL information into this comprehensive JSON format:

        {
          "documentType": "string",
          "documentTitle": "string",
          "extractionStep": "step1_complete_analysis",
          
          "allExtractedData": {
            "clientInformation": {
              "companyName": "string",
              "contactPerson": "string",
              "email": "string",
              "phone": "string",
              "address": "string",
              "website": "string",
              "industry": "string",
              "companySize": "string",
              "department": "string"
            },
            "projectInformation": {
              "projectName": "string",
              "projectType": "string",
              "description": "string",
              "fullDescription": "string - complete detailed description",
              "objectives": "array of strings",
              "goals": "array of strings",
              "scope": "array of strings",
              "features": "array of strings",
              "functionalities": "array of strings",
              "technologies": "array of strings",
              "platforms": "array of strings",
              "integrations": "array of strings"
            },
            "requirements": {
              "functional": "array of strings",
              "technical": "array of strings",
              "design": "array of strings",
              "performance": "array of strings",
              "security": "array of strings",
              "compliance": "array of strings",
              "accessibility": "array of strings",
              "userExperience": "array of strings"
            },
            "timeline": {
              "startDate": "string (YYYY-MM-DD)",
              "endDate": "string (YYYY-MM-DD)",
              "deadline": "string (YYYY-MM-DD)",
              "duration": "string",
              "milestones": "array of objects with {milestone: string, date: string, description: string}",
              "phases": "array of objects with {phase: string, duration: string, description: string}",
              "urgency": "string"
            },
            "budgetInformation": {
              "mentioned": "boolean",
              "exactAmount": "number",
              "currency": "string",
              "range": "string",
              "minAmount": "number",
              "maxAmount": "number",
              "breakdown": "array of objects with {item: string, amount: number, description: string}",
              "paymentTerms": "string",
              "paymentSchedule": "string",
              "budgetConstraints": "string"
            },
            "deliverables": "array of strings",
            "constraints": "array of strings",
            "assumptions": "array of strings",
            "risks": "array of strings",
            "successCriteria": "array of strings",
            "stakeholders": "array of strings",
            "team": "array of strings",
            "resources": "array of strings",
            "additionalNotes": "string",
            "attachments": "array of strings",
            "references": "array of strings"
          }
        }

        INSTRUCTIONS FOR STEP 1:
        1. Extract EVERYTHING available in the document - be extremely thorough
        2. Don't skip any details, even if they seem minor
        3. If information is not available, use null for that field
        4. Include all dates, numbers, names, requirements, features mentioned
        5. Return only valid JSON without additional text or formatting
        6. This is the complete analysis - capture every detail

        Document Text:
        ${extractedText.substring(0, 40000)}
        `;

        result = await model.generateContent(step1Prompt);
        response = await result.response;
        text = response.text();
        
        console.log(`✅ Step 1 successful with model: ${modelName}`);
        break;
        
      } catch (modelError) {
        console.log(`❌ Step 1 failed with model ${modelName}:`, modelError.message);
        if (modelName === models[models.length - 1]) {
          throw modelError;
        }
        continue;
      }
    }

    // Parse Step 1 results
    let step1Data;
    try {
      let jsonText = text.trim();
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        step1Data = JSON.parse(jsonMatch[0]);
        console.log('✅ Step 1 data parsed successfully');
      } else {
        throw new Error('No JSON found in Step 1 response');
      }
    } catch (parseError) {
      console.error('❌ Step 1 JSON parsing error:', parseError);
      throw new Error('Failed to parse Step 1 JSON response: ' + parseError.message);
    }

    // STEP 2: Filter and extract only important information for pricing calculator
    console.log('🎯 STEP 2: Extracting important information for pricing calculator...');
    
    for (const modelName of models) {
      try {
        console.log(`Trying model for Step 2: ${modelName}`);
        model = genAI.getGenerativeModel({ model: modelName });
        
        const step2Prompt = `
        You are an AI assistant specialized in pricing calculator analysis.
        
        STEP 2: EXTRACT IMPORTANT INFORMATION FOR PRICING CALCULATOR
        
        Based on the complete document analysis below, extract ONLY the important information needed for pricing calculations.
        
        COMPLETE DOCUMENT DATA FROM STEP 1:
        ${JSON.stringify(step1Data, null, 2)}
        
        Extract and organize ONLY the pricing-relevant information into this JSON format:

        {
          "extractionStep": "step2_pricing_focused",
          "pricingCalculatorData": {
            "requirements": {
              "specified": "boolean - are requirements clearly specified?",
              "functional": "array of strings - key functional requirements for pricing",
              "technical": "array of strings - technical specs that affect pricing", 
              "features": "array of strings - main features that impact cost",
              "complexity": "string (low/medium/high/enterprise) - overall complexity assessment",
              "integrations": "array of strings - integrations that affect pricing"
            },
            "projectOverview": {
              "summary": "string - concise 2-3 sentence summary for pricing context",
              "type": "string (web_app/mobile_app/api/website/ecommerce/enterprise_system/etc)",
              "scale": "string (small/medium/large/enterprise) - project scale assessment",
              "industry": "string - client industry",
              "targetAudience": "string - who will use this system",
              "platforms": "array of strings - platforms to support"
            },
            "deadlineDelivery": {
              "hasDeadline": "boolean - is there a specific deadline?",
              "deadline": "string (YYYY-MM-DD) - final delivery date if specified",
              "urgency": "string (flexible/standard/urgent/critical) - how urgent is this project",
              "timeframe": "string - estimated duration or preferred timeframe",
              "phases": "array of strings - key delivery phases that affect pricing"
            },
            "budgetInfo": {
              "mentioned": "boolean - is budget mentioned in document?",
              "estimatedRange": "string - budget range if mentioned (e.g., '$10k-50k')",
              "exactAmount": "number - exact amount if specified",
              "currency": "string - currency type",
              "budgetType": "string (fixed/range/open/not_specified)",
              "constraints": "string - any budget constraints or limitations",
              "expectation": "string - client's budget expectations or context"
            },
            "clientProjectInfo": {
              "clientName": "string - client company name",
              "projectName": "string - project name", 
              "contactInfo": "string - main contact person and details",
              "companySize": "string (startup/small/medium/large/enterprise)",
              "hasExistingSystem": "boolean - do they have existing systems?",
              "previousProjects": "boolean - do they mention previous similar projects?",
              "industryExperience": "string - their experience level with similar projects"
            },
            "pricingFactors": {
              "riskFactors": "array of strings - factors that increase project risk/cost",
              "complexityDrivers": "array of strings - what makes this project complex",
              "scopeClarity": "string (clear/moderate/unclear) - how well defined is the scope",
              "changeRisk": "string (low/medium/high) - likelihood of scope changes",
              "specialRequirements": "array of strings - any special requirements affecting cost"
            }
          },
          "extractionMetadata": {
            "confidence": "number (0-1) - confidence in extraction accuracy",
            "completeness": "number (0-1) - how complete the pricing information is",
            "keyMissingInfo": "array of strings - critical missing info for accurate pricing",
            "pricingReadiness": "string (ready/needs_clarification/insufficient_info)",
            "recommendedNextSteps": "array of strings - what to clarify with client"
          }
        }

        CRITICAL INSTRUCTIONS FOR STEP 2:
        1. Focus ONLY on information that directly impacts pricing decisions
        2. Assess complexity, risk, and scope clarity for pricing
        3. Identify missing information that would be needed for accurate quotes
        4. Be concise but comprehensive in pricing-relevant details
        5. Return only valid JSON without additional text or formatting
        6. This should be actionable data for pricing calculations
        `;

        result = await model.generateContent(step2Prompt);
        response = await result.response;
        text = response.text();
        
        console.log(`✅ Step 2 successful with model: ${modelName}`);
        break;
        
      } catch (modelError) {
        console.log(`❌ Step 2 failed with model ${modelName}:`, modelError.message);
        if (modelName === models[models.length - 1]) {
          throw modelError;
        }
        continue;
      }
    }

    // Parse Step 2 results
    try {
      let jsonText = text.trim();
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const step2Data = JSON.parse(jsonMatch[0]);
        console.log('✅ Step 2 data parsed successfully');
        
        // Combine both steps for final result
        return {
          success: true,
          step1_completeAnalysis: step1Data,
          step2_pricingFocused: step2Data,
          modelUsed: model._modelName || 'unknown',
          processingSteps: ['complete_extraction', 'pricing_filtering']
        };
      } else {
        throw new Error('No JSON found in Step 2 response');
      }
    } catch (parseError) {
      console.error('❌ Step 2 JSON parsing error:', parseError);
      throw new Error('Failed to parse Step 2 JSON response: ' + parseError.message);
    }
    
  } catch (error) {
    console.error('❌ Two-step processing failed:', error);
    throw new Error('Failed to process text with two-step Gemini AI: ' + error.message);
  }
};

// Enhance extracted data with additional processing
const enhanceExtractedData = (geminiResult, pdfMetadata) => {
  const enhancedData = {
    extractionMetadata: {
      extractionMethod: 'two-step-ai-processing',
      aiModel: geminiResult.modelUsed || 'unknown',
      processingSteps: geminiResult.processingSteps || ['single_step'],
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
    completeExtraction: geminiResult.step1_completeAnalysis || null,
    pricingFocusedData: geminiResult.step2_pricingFocused || geminiResult.data || null,
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
    
    // Process the extracted text with Gemini AI - Two Step Method
    console.log('🚀 Processing text with Two-Step Gemini AI Method...');
    console.log('📋 Step 1: Complete document analysis');
    console.log('🎯 Step 2: Pricing calculator focused extraction');
    const geminiResult = await processTextWithGeminiTwoStep(pdfData.text);
    
    // Enhance the extracted data with metadata
    const enhancedData = enhanceExtractedData(geminiResult, pdfData);
    
    // Clean up uploaded PDF
    await fs.unlink(pdfPath).catch(console.error);
    
    res.status(200).json({
      success: true,
      message: 'PDF processed successfully with two-step AI analysis',
      processingMethod: 'two-step-extraction',
      data: enhancedData,
      metadata: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        processedAt: new Date().toISOString(),
        userId: req.user?._id || 'anonymous',
        extractionSuccess: geminiResult.success,
        processingSteps: ['step1_complete_analysis', 'step2_pricing_focused'],
        aiModel: geminiResult.modelUsed || 'unknown'
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

// Test Gemini API connection
export const testGeminiConnection = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Gemini API key is not configured'
      });
    }

    // Try different models to see which one works
    const models = ['gemini-2.5-pro'];
    const results = [];
    
    for (const modelName of models) {
      try {
        console.log(`Testing model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say hello!");
        const response = await result.response;
        const text = response.text();
        
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
        ? `Gemini API connection successful! ${workingModels.length} model(s) working.`
        : 'Gemini API connection failed for all models',
      data: {
        results,
        workingModels: workingModels.map(r => r.model),
        apiKeyConfigured: true,
        timestamp: new Date().toISOString(),
        userId: req.user?._id || 'anonymous'
      }
    });

  } catch (error) {
    console.error('Gemini API test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Gemini API connection failed',
      error: error.message,
      data: {
        apiKeyConfigured: !!process.env.GEMINI_API_KEY,
        timestamp: new Date().toISOString()
      }
    });
  }
};
