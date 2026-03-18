import mongoose, { Schema, Document, Model } from "mongoose";

/*
=====================================================
 INTERFACE (STRICT TYPE SAFETY)
=====================================================
*/

export interface IUser extends Document {
  fullname: string;
  email: string;
  password: string;

  avatar?: string;
  gender?: "Male" | "Female" | "Other";
  mobile?: string;

  role: "User" | "Seller" | "Rider" | "SellerAdmin" | "Admin" | "SuperAdmin";

  // FOOD DELIVERY
  addresses?: {
    label?: string;
    fulladdress?: string;
    city?: string;
    area?: string;
    lat?: number;
    lng?: number;
    isdefault?: boolean;
  }[];

  wallet?: {
    balance: number;
    currency: string;
  };

  totalorders?: number;
  lastorderat?: Date;

  // SECURITY
  isverified?: boolean;
  isblocked?: boolean;

  // OTP
  signupotp?: string;
  signupotpexpires?: Date;
  signupattempts?: number;

  signinotp?: string;
  signinotpexpires?: Date;
  signinattempts?: number;

  // ANTI BRUTE FORCE
  loginattempts?: number;
  lockuntil?: Date;

  // DEVICE
  lastloginip?: string;
  lastdevice?: string;

  // TOKENS
  refreshtoken?: string;

  createdAt?: Date;
  updatedAt?: Date;

  // METHODS
  isLocked(): boolean;
}

/*
=====================================================
 SCHEMA
=====================================================
*/

const userschema: Schema<IUser> = new Schema(
  {
    fullname: { type: String },

    email: { type: String, unique: true, index: true },

    password: { type: String },

    avatar: { type: String },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },

    mobile: { type: String },

    role: {
      type: String,
      enum: ["User", "Seller", "Rider", "SellerAdmin", "Admin", "SuperAdmin"],
      default: "User",
    },

    // FOOD DELIVERY
    addresses: [
      {
        label: String,
        fulladdress: String,
        city: String,
        area: String,
        lat: Number,
        lng: Number,
        isdefault: { type: Boolean, default: false },
      },
    ],

    wallet: {
      balance: { type: Number, default: 0 },
      currency: { type: String, default: "BDT" },
    },

    totalorders: { type: Number, default: 0 },
    lastorderat: Date,

    // SECURITY
    isverified: { type: Boolean, default: false },
    isblocked: { type: Boolean, default: false },

    // OTP SYSTEM
    signupotp: String,
    signupotpexpires: Date,
    signupattempts: { type: Number, default: 0 },

    signinotp: String,
    signinotpexpires: Date,
    signinattempts: { type: Number, default: 0 },

    // BRUTE FORCE
    loginattempts: { type: Number, default: 0 },
    lockuntil: Date,

    // DEVICE
    lastloginip: String,
    lastdevice: String,

    // TOKEN
refreshtoken:String
  },
  {
    timestamps: true,
  }
);

/*
=====================================================
 METHODS (TYPE SAFE)
=====================================================
*/

userschema.methods.isLocked = function (): boolean {
  return !!(this.lockuntil && this.lockuntil > Date.now());
};

/*
=====================================================
 MODEL EXPORT (NO TS ERROR)
=====================================================
*/

const User: Model<IUser> = mongoose.model<IUser>("user", userschema);

export default User;