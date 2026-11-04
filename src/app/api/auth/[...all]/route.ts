import { getAuth } from '@/lib/account/auth'

/*
 * Better Auth's endpoints: the GitHub callback, the sign-in link's check, sign-out, and
 * once BETTER_AUTH_API_KEY is set, the dashboard's. Under /api, so the site lock doesn't stand in front.
 */
const handle = async (req: Request) => (await getAuth()).handler(req)

export { handle as GET, handle as POST }
