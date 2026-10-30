"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { definirPerfil } from "@/lib/definir-perfil";

export async function handleOnboard(formData: FormData) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("No Logged In User");
    }

    const isCompanionValue = formData.get("isCompanion");
    const isCompanion = isCompanionValue === "true";

    if (isCompanionValue === null) {
      throw new Error("Missing isCompanion value in form data");
    }

    await definirPerfil(userId, isCompanion);

    // 3. Redirect logic
    if (isCompanion) {
      redirect("/companions/register");
    } else {
      redirect("/location");
    }
  } catch (error) {
    // Next.js redirect errors must be re-thrown
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }

    console.error("Error in handleOnboard:", error);
    throw new Error(
      `Error Updating User Metadata: ${error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}
