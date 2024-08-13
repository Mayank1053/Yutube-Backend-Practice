import mongoose, {Schema} from "mongoose";

const communitySchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  writer: {
    type: Schema.Types.ObjectId,
    ref: "User"
  }
}, {timestamps: true});


export const CommunityPost = mongoose.model("CommunityPost", communitySchema);