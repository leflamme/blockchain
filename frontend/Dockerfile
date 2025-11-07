# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy all application code (package.json, .jsx, etc.)
COPY . .

# --- START OF FINAL BUILD FIX ---
# Nuke any existing node_modules or package-lock.json (from local machine)
# and run ONE clean install. This solves all esbuild/picomatch errors.
RUN rm -rf node_modules package-lock.json
RUN npm install
# --- END OF FINAL BUILD FIX ---

# --- START OF CONFIGURATION FIX ---
# Overwrite/create all config files to ensure they are 100% correct

# 1. Create the PostCSS config (using 'tailwindcss', NOT '@tailwindcss/postcss')
RUN echo "export default { plugins: { 'tailwindcss': {}, 'autoprefixer': {} } }" > postcss.config.js

# 2. Create the Tailwind config
RUN echo "export default { content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'], theme: { extend: {} }, plugins: [] }" > tailwind.config.js

# 3. Create the index.css file with Tailwind directives
RUN printf "@tailwind base;\n@tailwind components;\n@tailwind utilities;" > /app/src/index.css

# 4. Prepend the CSS import to the main.jsx entry file
RUN printf "import './index.css';\n%s" "$(cat /app/src/main.jsx)" > /app/src/main.jsx.tmp && mv /app/src/main.jsx.tmp /app/src/main.jsx
# --- END OF CONFIGURATION FIX ---

# Build the app
RUN npm run build

# Install a simple server to serve static files
RUN npm install -g serve

# Expose the port the app runs on
EXPOSE 3000

# Command to serve the built app
CMD ["serve", "-s", "dist", "-l", "3000"]