import CredentialsProvider from "next-auth/providers/credentials";
import { type NextAuthOptions } from "next-auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        name: { label: "Name", type: "name" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credenciales inválidas");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("Credenciales inválidas");
          // ! Why tu pusiste eto aquí tell me why 
          // return await prisma.user.create({
          //   data: {
          //     name: credentials.name ?? credentials.email,
          //     email: credentials.email,
          //     password: await bcrypt.hash(credentials.password, 10),
          //   },
          // });
        }

        if(!user.isActive){
          throw new Error("Usuario inhabilitado, por favor contacte al administrador");
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error("Credenciales inválidas");
        }

        return user;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
    // ...existing code...
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role,
        },
      };
    },
  },
  // ...existing code...
} satisfies NextAuthOptions;