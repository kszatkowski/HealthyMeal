# HealthyMeal

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

**HealthyMeal** is an MVP application designed to solve the time-consuming problem of customizing culinary recipes to individual dietary needs. The application uses Artificial Intelligence to generate and modify recipes based on user-defined preferences, such as favorite ingredients, disliked products, and allergens.

### Core Features
- **AI Recipe Generation**: Creates personalized meal suggestions based on user preferences.
- **Preference Profile**: Allows users to define their likes, dislikes, and allergens for tailored results.
- **Recipe Management (CRUD)**: Enables users to save, view, edit, and delete both AI-generated and manually added recipes.
- **User Authentication**: Simple and secure authentication system using email and password.

## Tech Stack

The project is built with a modern tech stack focused on performance and developer experience.

| Category          | Technology                                                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**      | [Astro 5](https://astro.build/), [React 19](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/), [Tailwind 4](https://tailwindcss.com/), [Shadcn/ui](https://ui.shadcn.com/) |
| **Backend**       | [Supabase](https://supabase.io/) (PostgreSQL Database, Authentication, BaaS)                                                              |
| **AI Services**   | [Openrouter.ai](https://openrouter.ai/) (Access to various AI models)                                                                     |
| **CI/CD & Hosting** | [GitHub Actions](https://github.com/features/actions), [DigitalOcean](https://www.digitalocean.com/) (Docker)                             |


## Getting Started Locally

Follow these instructions to set up the project on your local machine for development and testing.

### Prerequisites

- **Node.js**: Version `22.14.0` is required. We recommend using a version manager like [nvm](https://github.com/nvm-sh/nvm).
  ```sh
  nvm use
  ```
- **Package Manager**: This project uses `npm`.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/kszatkowski/HealthyMeal.git
    cd HealthyMeal
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project by copying the example file:
    ```sh
    cp .env.example .env
    ```
    You will need to populate this file with your credentials for services like Supabase and Openrouter.ai.

4.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## Available Scripts

The following scripts are available in the `package.json`:

| Script         | Description                                      |
| -------------- | ------------------------------------------------ |
| `npm run dev`    | Starts the development server with hot-reloading. |
| `npm run build`  | Builds the application for production.           |
| `npm run preview`| Previews the production build locally.           |
| `npm run lint`   | Lints the codebase for errors.                   |
| `npm run lint:fix`| Lints and automatically fixes issues.         |
| `npm run format` | Formats the code using Prettier.                 |

## Project Scope

### In Scope (MVP Features)

- **User Accounts**: Registration, login, and logout functionality.
- **Preference Profile**: Users can define "likes," "dislikes," and "allergens."
- **AI Recipe Generator**: A form to generate recipes based on user preferences with a daily limit of 3 requests.
- **Full Recipe Management (CRUD)**: Users can create, save, edit, and delete their own recipes and AI-generated ones.
- **Onboarding**: A non-intrusive notification encouraging new users to complete their preference profile.

## Project Status

**Status**: In Development 🚧

This project is currently under active development for its Minimum Viable Product (MVP) release.

## License

This project is licensed under the MIT License.
