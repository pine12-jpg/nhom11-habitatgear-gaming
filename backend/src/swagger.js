const swaggerJsdoc = require("swagger-jsdoc");

module.exports = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "GVN Gaming API",
      version: "1.0.0",
      description: "API website bán thiết bị gaming - Nhóm 11",
    },
    servers: [
      { url: "https://gearvn-gaming.onrender.com", description: "Render" },
      { url: "http://localhost:4000", description: "Local" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
  },
   apis: [__dirname + "/docs/*.yaml"],
});