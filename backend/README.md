backend/
 ├── src/
 │    ├── app.js              # Express app setup (middleware, routes)
 │    ├── server.js           # Starts the app, reads PORT
 │    │
 │    ├── routes/             # Route definitions (grouped by domain)
 │    │    ├── auth.routes.js
 │    │    ├── user.routes.js
 │    │    └── message.routes.js
 │    │
 │    ├── controllers/        # Route handlers (logic for each endpoint)
 │    │    ├── auth.controller.js
 │    │    ├── user.controller.js
 │    │    └── message.controller.js
 │    │
 │    ├── middleware/         # Custom middleware (auth, errors, etc.)
 │    │    ├── errorHandler.js
 │    │    └── authMiddleware.js
 │    │
 │    └── config/             # Configuration files
 │         └── index.js       # Loads env variables, config objects
 │
 ├── .env                     # Local environment variables
 ├── .env.example             # Example env (no secrets, just keys)
 ├── package.json
 ├── README.md
 └── .gitignore
