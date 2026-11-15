"use server";

import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";
import { signIn } from "@/lib/auth";

export async function registerUser(
  name: string,
  email: string,
  password: string
) {
  try {
    // Проверяем, существует ли пользователь с таким email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "Пользователь с таким email уже существует" };
    }

    // Хешируем пароль
    const passwordHash = await hash(password, 12);

    // Создаем пользователя
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    // Автоматически входим в систему
    await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    return { error: null };
  } catch {
    return { error: "Произошла ошибка при регистрации" };
  }
}
