/**
 * @swagger
 * tags:
 *   - name: Health
 *   - name: Auth
 *   - name: Waterpoints
 *   - name: FaultReports
 *   - name: Analytics
 *   - name: Uploads
 *   - name: Comments
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API and DB status
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new citizen user and send email verification
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered
 */

/**
 * @swagger
 * /api/auth/register-admin-with-invite:
 *   post:
 *     summary: Register an admin account using an invite token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterAdminWithInviteRequest'
 *     responses:
 *       201:
 *         description: Admin user registered
 */

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     summary: Verify email with token
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified
 */

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResendVerificationRequest'
 *     responses:
 *       200:
 *         description: Verification email sent
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in a verified user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 */

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *     responses:
 *       200:
 *         description: Token refreshed
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user and invalidate refresh token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 */

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Send password reset link if account exists
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Request accepted
 */

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using reset token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successful
 */

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change password for authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed successfully
 */

/**
 * @swagger
 * /api/auth/admin-invites:
 *   post:
 *     summary: Create admin invite (admin only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAdminInviteRequest'
 *     responses:
 *       201:
 *         description: Invite created (token returned once)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateAdminInviteResponse'
 *   get:
 *     summary: List admin invites (admin only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, used, revoked, expired, all], default: active }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *     responses:
 *       200:
 *         description: Invite list
 */

/**
 * @swagger
 * /api/auth/admin-invites/{id}:
 *   delete:
 *     summary: Revoke an admin invite (admin only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Invite revoked
 */

/**
 * @swagger
 * /api/waterpoints:
 *   get:
 *     summary: List waterpoints (public)
 *     tags: [Waterpoints]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [borehole, well, tap] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [functional, faulty, under_repair] }
 *       - in: query
 *         name: community
 *         schema: { type: string }
 *       - in: query
 *         name: lga
 *         schema: { type: string }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [createdAt, updatedAt, name, status], default: createdAt }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paged waterpoint list
 *   post:
 *     summary: Create waterpoint (admin only)
 *     tags: [Waterpoints]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWaterpointRequest'
 *     responses:
 *       201:
 *         description: Waterpoint created (may include duplicateReviewWarning when within review zone)
 *       409:
 *         description: Waterpoint blocked as too close (within hard minimum-distance policy)
 */

/**
 * @swagger
 * /api/waterpoints/dedupe-audit:
 *   get:
 *     summary: Run dedupe audit scan and suggest merge/review candidates (admin only)
 *     tags: [Waterpoints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: distanceMeters
 *         schema: { type: integer, minimum: 1, maximum: 2000 }
 *         description: Override audit distance threshold (meters)
 *       - in: query
 *         name: maxItems
 *         schema: { type: integer, minimum: 10, maximum: 2000, default: 400 }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [borehole, well, tap] }
 *       - in: query
 *         name: community
 *         schema: { type: string }
 *       - in: query
 *         name: includeResolved
 *         schema: { type: boolean, default: false }
 *         description: Include previously resolved records in audit scan
 *     responses:
 *       200:
 *         description: Dedupe audit report
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DuplicateAuditResponse'
 */

/**
 * @swagger
 * /api/waterpoints/review-queue:
 *   get:
 *     summary: List duplicate-review queue (admin only)
 *     tags: [Waterpoints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending_review, resolved_keep, resolved_merged, clear, all], default: pending_review }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paged duplicate-review queue
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DuplicateReviewQueueResponse'
 */

/**
 * @swagger
 * /api/waterpoints/{id}:
 *   get:
 *     summary: Get waterpoint by id (public)
 *     tags: [Waterpoints]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Waterpoint details
 *   patch:
 *     summary: Update waterpoint (admin only)
 *     tags: [Waterpoints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateWaterpointRequest'
 *     responses:
 *       200:
 *         description: Waterpoint updated (may include duplicateReviewWarning when within review zone)
 *       409:
 *         description: Waterpoint blocked as too close (within hard minimum-distance policy)
 *   delete:
 *     summary: Delete waterpoint (admin only)
 *     tags: [Waterpoints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Waterpoint deleted
 */

/**
 * @swagger
 * /api/waterpoints/{id}/review:
 *   patch:
 *     summary: Resolve duplicate-review status for a waterpoint (admin only)
 *     tags: [Waterpoints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResolveDuplicateReviewRequest'
 *     responses:
 *       200:
 *         description: Duplicate review resolved
 *       400:
 *         description: Invalid resolution input or waterpoint not pending review
 *       404:
 *         description: Waterpoint or merge target not found
 */

/**
 * @swagger
 * /api/fault-reports:
 *   post:
 *     summary: Submit fault report (citizen/admin)
 *     tags: [FaultReports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFaultReportRequest'
 *     responses:
 *       201:
 *         description: Fault report submitted
 *   get:
 *     summary: List fault reports (admin sees all, citizen sees own)
 *     tags: [FaultReports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, verified, dismissed, resolved] }
 *       - in: query
 *         name: community
 *         schema: { type: string }
 *       - in: query
 *         name: waterpointId
 *         schema: { type: string }
 *       - in: query
 *         name: reporterPhone
 *         schema: { type: string }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [createdAt, updatedAt, status], default: createdAt }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paged fault report list
 */

/**
 * @swagger
 * /api/fault-reports/{id}:
 *   get:
 *     summary: Get one fault report by id
 *     tags: [FaultReports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Fault report details
 */

/**
 * @swagger
 * /api/fault-reports/{id}/status:
 *   patch:
 *     summary: Update fault report status (admin only)
 *     tags: [FaultReports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateFaultReportStatusRequest'
 *     responses:
 *       200:
 *         description: Fault report status updated
 */

/**
 * @swagger
 * /api/analytics/admin-overview:
 *   get:
 *     summary: Admin dashboard overview analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aggregated admin dashboard metrics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminOverviewResponse'
 */

/**
 * @swagger
 * /api/analytics/citizen-overview:
 *   get:
 *     summary: Citizen dashboard overview analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aggregated citizen dashboard metrics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CitizenOverviewResponse'
 */

/**
 * @swagger
 * /api/analytics/duplicate-review-insights:
 *   get:
 *     summary: Duplicate review quality metrics for admin dashboard
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer, minimum: 1, maximum: 365, default: 30 }
 *         description: Rolling window (days) for reviewed metrics
 *     responses:
 *       200:
 *         description: Duplicate review KPI metrics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DuplicateReviewInsightsResponse'
 */

/**
 * @swagger
 * /api/uploads/image:
 *   post:
 *     summary: Upload one or more images (admin only, max 5)
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Uploaded image metadata
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadImageResponse'
 */

/**
 * @swagger
 * /api/comments:
 *   get:
 *     summary: List community comments (authenticated users)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 50 }
 *       - in: query
 *         name: waterpointId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paged comment list
 *   post:
 *     summary: Post community comment (authenticated users)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCommentRequest'
 *     responses:
 *       201:
 *         description: Comment created
 *
 * /api/comments/{id}:
 *   delete:
 *     summary: Delete own comment (or admin delete any)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Comment deleted
 */
