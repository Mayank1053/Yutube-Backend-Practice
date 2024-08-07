import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subsriber: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
