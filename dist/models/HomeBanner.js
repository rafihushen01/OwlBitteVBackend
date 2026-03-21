import mongoose, { Schema } from "mongoose";
const HomeBannerSchema = new Schema({
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
}, {
    timestamps: true
});
export default mongoose.model("homebanner", HomeBannerSchema);
//# sourceMappingURL=HomeBanner.js.map