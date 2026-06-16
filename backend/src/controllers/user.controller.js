import { HttpError } from "../middleware/errorHandler.js";
import { User } from "../models/user.model.js";

function escapeRegex(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listUsers(req, res) {
  const { page, limit, q, role, status, sortBy, sortOrder } = req.validated.query;
  const filter = {};

  if (role) filter.role = role;
  if (status) filter.status = status;
  if (q) {
    const safe = escapeRegex(q);
    filter.$or = [
      { fullName: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
      { community: { $regex: safe, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  res.json({
    items: items.map((user) => ({
      id: String(user._id),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      community: user.community,
      lga: user.lga ?? null,
      status: user.status ?? "active",
      statusReason: user.statusReason ?? null,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}

export async function updateUserStatus(req, res) {
  const { id } = req.validated.params;
  const { status, reason } = req.validated.body;

  // Prevent self-block/self-suspension
  if (id === req.authUser.id) {
    throw new HttpError(400, "You cannot block or suspend your own administrator account");
  }

  const user = await User.findById(id);
  if (!user) throw new HttpError(404, "User not found");

  user.status = status;
  user.statusReason = status === "active" ? null : (reason ?? null);

  // If blocking/suspending, also clear active refresh token session so they are forced to log out immediately
  if (status !== "active") {
    user.refreshTokenHash = null;
  }

  await user.save();

  res.json({
    message: `User status updated to ${status} successfully`,
    user: {
      id: String(user._id),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      community: user.community,
      lga: user.lga ?? null,
      status: user.status,
      statusReason: user.statusReason,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
}
