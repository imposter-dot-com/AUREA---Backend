import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  // User profile fields
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot be more than 30 characters'],
    match: [/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores']
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  avatar: {
    type: String,
    default: null
  },
  avatarPublicId: {
    type: String,
    default: null
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  // Premium subscription fields
  isPremium: {
    type: Boolean,
    default: false
  },
  premiumStartDate: {
    type: Date,
    default: null
  },
  premiumEndDate: {
    type: Date,
    default: null
  },
  premiumType: {
    type: String,
    enum: ['none', 'monthly', 'yearly', 'lifetime'],
    default: 'none'
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free'
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  storage: {
    used: {
      type: Number,
      default: 0
    },
    limit: {
      type: Number,
      default: 10737418240 // 10GB in bytes
    }
  }
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Instance method to generate auth token payload
userSchema.methods.toAuthJSON = function() {
  return {
    id: this._id,
    _id: this._id,
    username: this.username,
    firstName: this.firstName,
    lastName: this.lastName,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    emailVerified: this.emailVerified,
    role: this.role,
    isPremium: this.checkPremiumStatus(),
    premiumType: this.premiumType,
    createdAt: this.createdAt
  };
};

// Instance method to check if user has active premium subscription
userSchema.methods.checkPremiumStatus = function() {
  // If lifetime premium, always return true
  if (this.premiumType === 'lifetime') {
    return true;
  }

  // If no premium status set, return false
  if (!this.isPremium || !this.premiumEndDate) {
    return false;
  }

  // Check if premium has expired
  const now = new Date();
  if (now > this.premiumEndDate) {
    return false;
  }

  return true;
};

// Instance method to get premium info
userSchema.methods.getPremiumInfo = function() {
  const isActive = this.checkPremiumStatus();
  
  return {
    isPremium: isActive,
    premiumType: this.premiumType,
    premiumStartDate: this.premiumStartDate,
    premiumEndDate: this.premiumEndDate,
    daysRemaining: isActive && this.premiumEndDate 
      ? Math.ceil((this.premiumEndDate - new Date()) / (1000 * 60 * 60 * 24))
      : 0
  };
};

// Static method to manually set premium status (for testing/admin purposes)
userSchema.statics.setPremiumStatus = async function(userId, premiumType, duration = null) {
  const user = await this.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  user.isPremium = true;
  user.premiumType = premiumType;
  user.premiumStartDate = new Date();

  if (premiumType === 'lifetime') {
    user.premiumEndDate = null;
  } else if (premiumType === 'monthly') {
    user.premiumEndDate = new Date(Date.now() + (duration || 30) * 24 * 60 * 60 * 1000);
  } else if (premiumType === 'yearly') {
    user.premiumEndDate = new Date(Date.now() + (duration || 365) * 24 * 60 * 60 * 1000);
  }

  await user.save();
  return user;
};

const User = mongoose.model('User', userSchema);

export default User;
