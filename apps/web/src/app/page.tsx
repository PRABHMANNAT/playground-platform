import Workspace from "@/components/workspace";
import { access } from "@/lib/auth";
export default async function Page() {
  return <Workspace signedIn={Boolean(await access())} />;
}
