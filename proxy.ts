import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase is not configured, allow all requests through
  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    !supabaseUrl.startsWith('http')
  ) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const adminRoutes = ['/admin']
  const officerRoutes = ['/officer']

  const isPublicRoute =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/reports/public')

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || 'citizen'

    if (pathname === '/login' || pathname === '/register') {
      const url = request.nextUrl.clone()
      if (role === 'admin') url.pathname = '/admin/dashboard'
      else if (role === 'officer') url.pathname = '/officer/dashboard'
      else url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    if (adminRoutes.some((r) => pathname.startsWith(r)) && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    if (
      officerRoutes.some((r) => pathname.startsWith(r)) &&
      role !== 'officer' &&
      role !== 'admin'
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
