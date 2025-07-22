import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Create a response that will clear the auth cookie
    const response = NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    );

    // Function to clear cookie with all possible variations
    const clearCookie = (name: string) => {
      // Basic clear
      response.cookies.set({
        name,
        value: '',
        path: '/',
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      // Clear with domain
      response.cookies.set({
        name,
        value: '',
        path: '/',
        domain: request.headers.get('host')?.split(':')[0],
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
    };

    // Clear both possible cookie names
    clearCookie('auth-token');
    clearCookie('auth_token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
