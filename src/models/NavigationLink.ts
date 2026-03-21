import mongoose, { Schema, Document } from "mongoose";

export interface INavigationLink extends Document {
  path: string; // /offer , /c , /megaoffer
  label?: string; // Optional (for UI display)
  isactive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NavigationLinkSchema: Schema<INavigationLink> = new Schema(
  {
    path: {
      type: String,
      required: true,
      unique: true
    },
    label: {
      type: String,
      default: ""
    },
    isactive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model<INavigationLink>("navigationlink", NavigationLinkSchema);