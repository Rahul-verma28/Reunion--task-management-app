// import { Task, type ITask as TaskDocument } from "@/lib/models/task"
// import { connectToDB } from "@/lib/mongoDB"
// import { type NextRequest, NextResponse } from "next/server"
// import { getDataFromToken } from "@/lib/getDataFormToken"
// import mongoose from "mongoose"

// interface TaskData {
//   title: string
//   startTime: string | Date
//   endTime: string | Date
//   priority: number
//   status?: string
// }

// // for validation
// const validateTaskData = (data: TaskData): void => {
//   const { title, startTime, endTime, priority } = data
//   if (!title || typeof title !== "string" || title.length > 50) {
//     throw new Error("Title is required and must be at max 50 characters.")
//   }
//   if (!startTime || isNaN(new Date(startTime).getTime())) {
//     throw new Error("Start time is required and must be a valid date.")
//   }
//   if (!endTime || isNaN(new Date(endTime).getTime())) {
//     throw new Error("End time is required and must be a valid date.")
//   }
//   if (isNaN(priority) || priority < 1 || priority > 5) {
//     throw new Error("Priority must be a number between 1 to 5.")
//   }
// }

// export async function POST(req: NextRequest) {
//   try {
//     await connectToDB()

//     const { title, startTime, endTime, priority, status = "pending" } = (await req.json()) as TaskData

//     // Authenticate user
//     const userId = getDataFromToken(req)
//     if (typeof userId !== "string") {
//       return userId
//     }

//     // Validate task data
//     validateTaskData({ title, startTime, endTime, priority, status })

//     const existingTask = await Task.findOne({ title, user: userId })
//     if (existingTask) {
//       return new NextResponse("Task title must be unique.", { status: 400 })
//     }

//     // Create the new task
//     const task = await Task.create({
//       title,
//       startTime: new Date(startTime),
//       endTime: new Date(endTime),
//       priority,
//       status,
//       user: userId,
//     })

//     return NextResponse.json(task, { status: 201 })
//   } catch (error) {
//     console.error("[POST_TASK]", error instanceof Error ? error.message : String(error))
//     return new NextResponse(error instanceof Error ? error.message : "Internal Server Error", { status: 500 })
//   }
// }

// interface QueryParams {
//   search?: string
//   sortBy?: string
//   sortOrder?: string
//   page?: string
//   limit?: string
//   status?: string
//   priority?: string
//   startTime?: string
//   endTime?: string
// }

// export async function GET(req: NextRequest) {
//   try {
//     await connectToDB()

//     const userId = getDataFromToken(req)
//     if (typeof userId !== "string") {
//       return new NextResponse("User not authenticated", { status: 401 })
//     }

//     const {
//       search,
//       sortBy = "createdAt",
//       sortOrder = "desc",
//       page = "1",
//       limit = "10",
//       status,
//       priority,
//       startTime,
//       endTime,
//     } = Object.fromEntries(req.nextUrl.searchParams) as QueryParams

//     const query: mongoose.FilterQuery<TaskDocument> = { user: userId }

//     if (search) {
//       query.title = { $regex: search, $options: "i" }
//     }

//     if (status) {
//       query.status = status
//     }

//     if (priority) {
//       query.priority = Number.parseInt(priority, 10)
//     }

//     if (startTime) {
//       query.startTime = { $gte: new Date(startTime) }
//     }

//     if (endTime) {
//       query.endTime = { $lte: new Date(endTime) }
//     }

//     // Sorting
//     const sort: { [key: string]: 1 | -1 } = { [sortBy]: sortOrder === "asc" ? 1 : -1 }

//     // Pagination
//     const skip = (Number.parseInt(page, 10) - 1) * Number.parseInt(limit, 10)
//     const tasks = await Task.find(query).sort(sort).skip(skip).limit(Number.parseInt(limit, 10))
//     const total = await Task.countDocuments(query)

//     return NextResponse.json(
//       {
//         tasks,
//         total,
//         page: Number.parseInt(page, 10),
//         limit: Number.parseInt(limit, 10),
//       },
//       { status: 200 },
//     )
//   } catch (error) {
//     console.error("[GET_TASKS]", error instanceof Error ? error.message : String(error))
//     return new NextResponse("Internal Server Error", { status: 500 })
//   }
// }

// export async function PATCH(req: NextRequest) {
//   try {
//     await connectToDB()

//     const { id, title, startTime, endTime, priority, status } = (await req.json()) as TaskData & { id: string }

//     if (!id || !mongoose.Types.ObjectId.isValid(id)) {
//       return new NextResponse("Invalid task ID.", { status: 400 })
//     }

//     const userId = getDataFromToken(req)

//     const task = await Task.findOne({ _id: id, user: userId })
//     if (!task) {
//       return new NextResponse("Task not found.", { status: 404 })
//     }

//     validateTaskData({ title, startTime, endTime, priority, status })

//     if (title) {
//       const existingTask = await Task.findOne({ title, user: userId, _id: { $ne: id } })
//       if (existingTask) {
//         return new NextResponse("Task title must be unique.", { status: 400 })
//       }
//     }

//     const updates: Partial<TaskDocument> = {}
//     if (title) updates.title = title
//     if (startTime) updates.startTime = new Date(startTime)
//     if (endTime) updates.endTime = new Date(endTime)
//     if (priority) updates.priority = priority
//     if (status) updates.status = status

//     const updatedTask = await Task.findByIdAndUpdate(id, updates, { new: true })

//     return NextResponse.json(updatedTask, { status: 200 })
//   } catch (error) {
//     console.error("[PATCH_TASK]", error instanceof Error ? error.message : String(error))
//     return new NextResponse("Internal Server Error", { status: 500 })
//   }
// }

// export async function DELETE(req: NextRequest) {
//   try {
//     console.log("Connecting to DB...")
//     await connectToDB()

//     console.log("Parsing request body...")
//     const { ids } = (await req.json()) as { ids: string[] }

//     if (!Array.isArray(ids) || ids.length === 0) {
//       return NextResponse.json({ message: "No task IDs provided." }, { status: 400 })
//     }

//     console.log("Validating IDs...")
//     const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id))
//     if (invalidIds.length > 0) {
//       return NextResponse.json({ message: `Invalid task IDs: ${invalidIds.join(", ")}` }, { status: 400 })
//     }

//     console.log("Getting user ID from token...")
//     const userId = getDataFromToken(req)
//     if (!userId) {
//       return NextResponse.json({ message: "Unauthorized." }, { status: 401 })
//     }

//     console.log("Deleting tasks...")
//     const result = await Task.deleteMany({ _id: { $in: ids }, user: userId })

//     console.log("Tasks deleted:", result.deletedCount)
//     return NextResponse.json({ message: `${result.deletedCount} task(s) deleted successfully.` }, { status: 200 })
//   } catch (error) {
//     console.error("[DELETE_TASKS_ERROR]", error instanceof Error ? error.message : String(error))
//     return NextResponse.json(
//       { message: "Internal Server Error", error: error instanceof Error ? error.message : String(error) },
//       { status: 500 },
//     )
//   }
// }



import { Task, type ITask as TaskDocument } from "@/lib/models/task"
import { connectToDB } from "@/lib/mongoDB"
import { type NextRequest, NextResponse } from "next/server"
import { getDataFromToken } from "@/lib/getDataFormToken"
import mongoose from "mongoose"

interface TaskData {
  title: string
  startTime: string | Date
  endTime: string | Date
  priority: number
  status?: "pending" | "finished"
}

// for validation
const validateTaskData = (data: TaskData): void => {
  const { title, startTime, endTime, priority, status } = data
  if (!title || typeof title !== "string" || title.length > 50) {
    throw new Error("Title is required and must be at max 50 characters.")
  }
  if (!startTime || isNaN(new Date(startTime).getTime())) {
    throw new Error("Start time is required and must be a valid date.")
  }
  if (!endTime || isNaN(new Date(endTime).getTime())) {
    throw new Error("End time is required and must be a valid date.")
  }
  if (isNaN(priority) || priority < 1 || priority > 5) {
    throw new Error("Priority must be a number between 1 to 5.")
  }
  if (status && status !== "pending" && status !== "finished") {
    throw new Error("Status must be either 'pending' or 'finished'.")
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDB()

    const { title, startTime, endTime, priority, status = "pending" } = (await req.json()) as TaskData

    // Authenticate user
    const userId = getDataFromToken(req)
    if (typeof userId !== "string") {
      return userId
    }

    // Validate task data
    validateTaskData({ title, startTime, endTime, priority, status })

    const existingTask = await Task.findOne({ title, user: userId })
    if (existingTask) {
      return new NextResponse("Task title must be unique.", { status: 400 })
    }

    // Create the new task
    const task = await Task.create({
      title,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      priority,
      status,
      user: userId,
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error("[POST_TASK]", error instanceof Error ? error.message : String(error))
    return new NextResponse(error instanceof Error ? error.message : "Internal Server Error", { status: 500 })
  }
}

interface QueryParams {
  search?: string
  sortBy?: string
  sortOrder?: string
  page?: string
  limit?: string
  status?: string
  priority?: string
  startTime?: string
  endTime?: string
}

export async function GET(req: NextRequest) {
  try {
    await connectToDB()

    const userId = getDataFromToken(req)
    if (typeof userId !== "string") {
      return new NextResponse("User not authenticated", { status: 401 })
    }

    const {
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = "1",
      limit = "10",
      status,
      priority,
      startTime,
      endTime,
    } = Object.fromEntries(req.nextUrl.searchParams) as QueryParams

    const query: mongoose.FilterQuery<TaskDocument> = { user: userId }

    if (search) {
      query.title = { $regex: search, $options: "i" }
    }

    if (status) {
      query.status = status
    }

    if (priority) {
      query.priority = Number.parseInt(priority, 10)
    }

    if (startTime) {
      query.startTime = { $gte: new Date(startTime) }
    }

    if (endTime) {
      query.endTime = { $lte: new Date(endTime) }
    }

    // Sorting
    const sort: { [key: string]: 1 | -1 } = { [sortBy]: sortOrder === "asc" ? 1 : -1 }

    // Pagination
    const skip = (Number.parseInt(page, 10) - 1) * Number.parseInt(limit, 10)
    const tasks = await Task.find(query).sort(sort).skip(skip).limit(Number.parseInt(limit, 10))
    const total = await Task.countDocuments(query)

    return NextResponse.json(
      {
        tasks,
        total,
        page: Number.parseInt(page, 10),
        limit: Number.parseInt(limit, 10),
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[GET_TASKS]", error instanceof Error ? error.message : String(error))
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectToDB()

    const { id, title, startTime, endTime, priority, status } = (await req.json()) as TaskData & { id: string }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return new NextResponse("Invalid task ID.", { status: 400 })
    }

    const userId = getDataFromToken(req)

    const task = await Task.findOne({ _id: id, user: userId })
    if (!task) {
      return new NextResponse("Task not found.", { status: 404 })
    }

    validateTaskData({ title, startTime, endTime, priority, status })

    if (title) {
      const existingTask = await Task.findOne({ title, user: userId, _id: { $ne: id } })
      if (existingTask) {
        return new NextResponse("Task title must be unique.", { status: 400 })
      }
    }

    const updates: Partial<TaskDocument> = {}
    if (title) updates.title = title
    if (startTime) updates.startTime = new Date(startTime)
    if (endTime) updates.endTime = new Date(endTime)
    if (priority) updates.priority = priority
    if (status) updates.status = status as "pending" | "finished"

    const updatedTask = await Task.findByIdAndUpdate(id, updates, { new: true })

    return NextResponse.json(updatedTask, { status: 200 })
  } catch (error) {
    console.error("[PATCH_TASK]", error instanceof Error ? error.message : String(error))
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    console.log("Connecting to DB...")
    await connectToDB()

    console.log("Parsing request body...")
    const { ids } = (await req.json()) as { ids: string[] }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: "No task IDs provided." }, { status: 400 })
    }

    console.log("Validating IDs...")
    const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id))
    if (invalidIds.length > 0) {
      return NextResponse.json({ message: `Invalid task IDs: ${invalidIds.join(", ")}` }, { status: 400 })
    }

    console.log("Getting user ID from token...")
    const userId = getDataFromToken(req)
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 })
    }

    console.log("Deleting tasks...")
    const result = await Task.deleteMany({ _id: { $in: ids }, user: userId })

    console.log("Tasks deleted:", result.deletedCount)
    return NextResponse.json({ message: `${result.deletedCount} task(s) deleted successfully.` }, { status: 200 })
  } catch (error) {
    console.error("[DELETE_TASKS_ERROR]", error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { message: "Internal Server Error", error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

