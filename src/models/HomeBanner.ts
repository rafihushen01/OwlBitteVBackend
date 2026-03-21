import mongoose, { Document, Schema } from "mongoose";

export interface IHomeBanner extends Document {
  order: number;
  media: string[];
  navigationlink: string;
  isactive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const HomeBannerSchema: Schema<IHomeBanner> = new Schema(
  {
    order: {
      type: Number,
      required: true
    },
    media: {
      type: [String],
      default: []
    },
    navigationlink: {
      type: String,
      default: ""
    },
    isactive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IHomeBanner>("homebanner", HomeBannerSchema);
