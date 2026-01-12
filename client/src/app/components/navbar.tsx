import { cookies } from 'next/headers';
import { NavbarClient } from './navbar-client';

/*
Eater Type Logic:
1. The user is new but signs up immediately:
   - Cannot fetch from cookies/database, display "None"
   - When they change it on dominos page, set cookie and sync to DB
   - Don't show the survey popup until user goes to dominos page

2. The user is old but signs in later:
   - Fetch from the cookie directly and save to database

3. The user is on a new device but has an account, so they sign in:
   - Fetch from the database and set the cookie

Note: Remove the cookie when user signs out for privacy.
If user doesn't sign in, keep the cookie.
*/

export async function Navbar() {
    // Read cookie on the server - no flash!
    const cookieStore = await cookies();
    const eaterType = cookieStore.get('user_eater_size')?.value || null;

    return <NavbarClient initialEaterType={eaterType} />;
}