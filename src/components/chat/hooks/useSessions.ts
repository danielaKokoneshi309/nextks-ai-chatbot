import { api_routes } from "../../../constants/routes";
import { useRouter } from "next/navigation";

const useSessions = () => {
  const router = useRouter();

  const createSession = async () => {
    try {
      const response = await fetch(api_routes.SESSIONS, {
        method: "POST",
      });
      const data = await response.json();
      if (data.sessionId) {
        router.push(`/s/${data.sessionId}`);
        return data.sessionId;
      }
    } catch (error) {
      console.error("Error creating session:", error);
    }
  };

  return { createSession };
};

export default useSessions;
