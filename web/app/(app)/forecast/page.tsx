import { redirect } from "next/navigation";

export default function ForecastDisabledPage() {
  redirect("/home");
}
