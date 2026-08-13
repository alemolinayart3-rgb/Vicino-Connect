import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET;
 if(!secret||request.headers.get('authorization')!==`Bearer ${secret}`)return NextResponse.json({error:'Acceso restringido.'},{status:401});
 const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SECRET_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await admin.rpc('suspend_stale_assignments');
 return NextResponse.json(error?{error:error.message}:{suspended:data},{status:error?400:200});
}
