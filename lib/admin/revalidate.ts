import { revalidatePath } from "next/cache";

// Public pages that render courses (packages) and their videos. Call after any
// package/video mutation so the site reflects the change immediately instead
// of waiting for the ISR window of the landing page.
export function revalidateCoursePages(): void {
  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath("/courses/[slug]", "page");
  revalidatePath("/dashboard");
}
