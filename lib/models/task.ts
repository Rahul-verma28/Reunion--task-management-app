// import mongoose, { Schema, Document } from "mongoose";

// interface ITask extends Document {
//   title: string;
//   startTime: Date;
//   endTime: Date;
//   priority: number;
//   status: "pending" | "finished";
//   user: mongoose.Schema.Types.ObjectId;
// }

// const taskSchema = new Schema<ITask>(
//   {
//     title: { type: String, required: true },
//     startTime: { type: Date, required: true },
//     endTime: { type: Date, required: true },
//     priority: { type: Number, required: true, min: 1, max: 5 },
//     status: { type: String, required: true, enum: ["pending", "finished"] },
//     user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   },
//   { timestamps: true }
// );

// // Check if the model already exists before creating it
// export const Task = mongoose.models.Task || mongoose.model<ITask>("Task", taskSchema);


import mongoose from "mongoose"

export interface ITask extends mongoose.Document {
  title: string
  startTime: Date
  endTime: Date
  priority: number
  status: "pending" | "finished"
  user: mongoose.Schema.Types.ObjectId
}

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  priority: { type: Number, required: true },
  status: { type: String, enum: ["pending", "finished"], default: "pending" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
})

export const Task = mongoose.models.Task || mongoose.model<ITask>("Task", taskSchema)
export type TaskDocument = mongoose.Document<unknown, object, ITask> & ITask

