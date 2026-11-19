import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const statusValidator = v.union(
  v.literal("todo"),
  v.literal("in_progress"),
  v.literal("done")
);

const priorityValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high")
);

// Lấy danh sách
export const getTasks = query({
  handler: async (ctx) => {
    return await ctx.db.query("tasks").order("desc").collect();
  },
});

// Thêm công việc
export const addTask = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    status: v.optional(statusValidator),
    priority: v.optional(priorityValidator),
    dueDate: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const title = args.title.trim();

    if (!title) {
      throw new Error("Tên công việc không được để trống");
    }

    const status = args.status ?? "todo";

    return await ctx.db.insert("tasks", {
      title,
      description: args.description ?? "",
      status,
      completed: status === "done",
      priority: args.priority ?? "medium",
      dueDate: args.dueDate ?? "",
      updatedAt: Date.now(),
    });
  },
});

// Cập nhật công việc
export const updateTask = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(statusValidator),
    priority: v.optional(priorityValidator),
    dueDate: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);

    if (!task) {
      throw new Error("Không tìm thấy công việc");
    }

    const patch = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) {
      const title = args.title.trim();
      if (!title) throw new Error("Tên không được để trống");
      patch.title = title;
    }

    if (args.description !== undefined) {
      patch.description = args.description;
    }

    if (args.priority !== undefined) {
      patch.priority = args.priority;
    }

    if (args.dueDate !== undefined) {
      patch.dueDate = args.dueDate;
    }

    if (args.status !== undefined) {
      patch.status = args.status;
      patch.completed = args.status === "done";
    }

    await ctx.db.patch(args.id, patch);
  },
});

// Xóa công việc
export const deleteTask = mutation({
  args: {
    id: v.id("tasks"),
  },

  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);

    if (!task) {
      throw new Error("Không tìm thấy công việc");
    }

    await ctx.db.delete(args.id);
  },
});