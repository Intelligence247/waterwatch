import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "WaterWatch API",
      version: "1.0.0",
      description: "Backend API documentation for WaterWatch",
    },
    servers: [
      {
        url: "http://localhost:8050",
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        RegisterRequest: {
          type: "object",
          required: ["fullName", "email", "password"],
          properties: {
            fullName: { type: "string", example: "Amina Yusuf" },
            email: { type: "string", format: "email", example: "amina@example.com" },
            password: { type: "string", example: "Password123!" },
            role: { type: "string", enum: ["citizen"], example: "citizen" },
            phone: { type: "string", example: "08012345678" },
            community: { type: "string", example: "Ilorin South" },
          },
        },
        RegisterAdminWithInviteRequest: {
          type: "object",
          required: ["fullName", "email", "password", "inviteToken"],
          properties: {
            fullName: { type: "string", example: "Water Board Admin" },
            email: { type: "string", format: "email", example: "admin@waterwatch.ng" },
            password: { type: "string", example: "Password123!" },
            inviteToken: { type: "string", example: "5adf...token..." },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },
        RefreshRequest: {
          type: "object",
          properties: {
            refreshToken: { type: "string" },
          },
        },
        ResendVerificationRequest: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", format: "email" },
          },
        },
        ForgotPasswordRequest: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", format: "email" },
          },
        },
        ResetPasswordRequest: {
          type: "object",
          required: ["token", "newPassword"],
          properties: {
            token: { type: "string" },
            newPassword: { type: "string", example: "NewPassword123!" },
          },
        },
        ChangePasswordRequest: {
          type: "object",
          required: ["currentPassword", "newPassword"],
          properties: {
            currentPassword: { type: "string" },
            newPassword: { type: "string", example: "NewPassword123!" },
          },
        },
        CreateAdminInviteRequest: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", format: "email", example: "newadmin@waterwatch.ng" },
            expiresInHours: { type: "integer", minimum: 1, maximum: 168, example: 72 },
          },
        },
        AdminInvite: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string", format: "email" },
            invitedBy: { type: "string" },
            expiresAt: { type: "string", format: "date-time" },
            usedAt: { type: "string", format: "date-time", nullable: true },
            usedBy: { type: "string", nullable: true },
            revokedAt: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        CreateAdminInviteResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Admin invite created" },
            emailSent: { type: "boolean" },
            invite: {
              type: "object",
              properties: {
                id: { type: "string" },
                email: { type: "string", format: "email" },
                expiresAt: { type: "string", format: "date-time" },
                invitedBy: { type: "string" },
                createdAt: { type: "string", format: "date-time" },
                inviteToken: { type: "string" },
              },
            },
          },
        },
        Waterpoint: {
          type: "object",
          properties: {
            id: { type: "string", example: "6818da0b79f66710fc9374bd" },
            name: { type: "string", example: "Adewole Borehole" },
            type: { type: "string", enum: ["borehole", "well", "tap"] },
            status: { type: "string", enum: ["functional", "faulty", "under_repair"] },
            latitude: { type: "number", example: 8.4833 },
            longitude: { type: "number", example: 4.5653 },
            community: { type: "string", example: "Adewole" },
            lga: { type: "string", example: "Ilorin West" },
            description: { type: "string", example: "Main source for morning supply." },
            photoUrl: { type: "string", example: "https://example.com/waterpoint.jpg" },
            photoUrls: {
              type: "array",
              items: { type: "string" },
              example: [
                "https://example.com/waterpoint-1.jpg",
                "https://example.com/waterpoint-2.jpg",
              ],
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateWaterpointRequest: {
          type: "object",
          required: ["name", "type", "status", "latitude", "longitude", "community", "lga"],
          properties: {
            name: { type: "string", example: "Adewole Borehole" },
            type: { type: "string", enum: ["borehole", "well", "tap"] },
            status: { type: "string", enum: ["functional", "faulty", "under_repair"] },
            latitude: { type: "number", example: 8.4833 },
            longitude: { type: "number", example: 4.5653 },
            community: { type: "string", example: "Adewole" },
            lga: { type: "string", example: "Ilorin West" },
            description: { type: "string", example: "Community borehole near market." },
            photoUrls: {
              type: "array",
              items: { type: "string" },
              maxItems: 5,
              example: ["https://example.com/borehole-1.jpg"],
            },
          },
        },
        UpdateWaterpointRequest: {
          type: "object",
          properties: {
            name: { type: "string" },
            type: { type: "string", enum: ["borehole", "well", "tap"] },
            status: { type: "string", enum: ["functional", "faulty", "under_repair"] },
            latitude: { type: "number" },
            longitude: { type: "number" },
            community: { type: "string" },
            lga: { type: "string" },
            description: { type: "string" },
            photoUrls: { type: "array", items: { type: "string" }, maxItems: 5 },
          },
        },
        FaultReport: {
          type: "object",
          properties: {
            id: { type: "string" },
            waterpointId: { type: "string", nullable: true },
            waterpoint: {
              type: "object",
              nullable: true,
              properties: {
                id: { type: "string" },
                name: { type: "string" },
              },
            },
            reporterName: { type: "string" },
            reporterPhone: { type: "string" },
            description: { type: "string" },
            photoUrl: { type: "string" },
            latitude: { type: "number", nullable: true },
            longitude: { type: "number", nullable: true },
            community: { type: "string" },
            status: { type: "string", enum: ["pending", "verified", "dismissed", "resolved"] },
            reviewedBy: { type: "string", nullable: true },
            reviewedAt: { type: "string", format: "date-time", nullable: true },
            resolutionNote: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Comment: {
          type: "object",
          properties: {
            id: { type: "string" },
            waterpointId: { type: "string", nullable: true },
            waterpoint: {
              type: "object",
              nullable: true,
              properties: {
                id: { type: "string" },
                name: { type: "string" },
              },
            },
            authorId: { type: "string" },
            author: {
              type: "object",
              nullable: true,
              properties: {
                fullName: { type: "string" },
                community: { type: "string" },
              },
            },
            content: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateCommentRequest: {
          type: "object",
          required: ["content"],
          properties: {
            waterpointId: { type: "string", nullable: true },
            content: { type: "string", example: "There has been low pressure since yesterday." },
          },
        },
        CreateFaultReportRequest: {
          type: "object",
          required: ["reporterName", "description", "community"],
          properties: {
            waterpointId: { type: "string", nullable: true },
            reporterName: { type: "string", example: "Amina Yusuf" },
            reporterPhone: { type: "string", example: "08012345678" },
            description: { type: "string", example: "No water flow since yesterday morning." },
            photoUrl: { type: "string", example: "https://example.com/fault.jpg" },
            latitude: { type: "number", example: 8.4931, nullable: true },
            longitude: { type: "number", example: 4.5523, nullable: true },
            community: { type: "string", example: "Adewole" },
          },
        },
        UpdateFaultReportStatusRequest: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["pending", "verified", "dismissed", "resolved"] },
            resolutionNote: { type: "string", example: "Repair team dispatched and issue fixed." },
          },
        },
        AdminOverviewResponse: {
          type: "object",
          properties: {
            stats: {
              type: "object",
              properties: {
                totalWaterpoints: { type: "integer" },
                functional: { type: "integer" },
                faulty: { type: "integer" },
                underRepair: { type: "integer" },
                totalReports: { type: "integer" },
                pendingReports: { type: "integer" },
                verifiedReports: { type: "integer" },
                resolvedReports: { type: "integer" },
                dismissedReports: { type: "integer" },
              },
            },
            recentWaterpoints: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  type: { type: "string" },
                  status: { type: "string" },
                  community: { type: "string" },
                  lga: { type: "string" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        CitizenOverviewResponse: {
          type: "object",
          properties: {
            userId: { type: "string" },
            stats: {
              type: "object",
              properties: {
                totalWaterpoints: { type: "integer" },
                functional: { type: "integer" },
                faulty: { type: "integer" },
                underRepair: { type: "integer" },
                myReports: { type: "integer" },
                pendingReports: { type: "integer" },
                resolvedReports: { type: "integer" },
                dismissedReports: { type: "integer" },
              },
            },
            nearbyWaterpoints: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  type: { type: "string" },
                  status: { type: "string" },
                  community: { type: "string" },
                },
              },
            },
          },
        },
        UploadImageResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Image upload successful" },
            imageUrl: { type: "string", example: "https://res.cloudinary.com/.../image/upload/v1/file.jpg" },
            publicId: { type: "string", example: "waterwatch/uploads/abc123" },
            imageUrls: {
              type: "array",
              items: { type: "string" },
            },
            publicIds: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      },
    },
  },
  apis: ["./src/docs/swagger.paths.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
