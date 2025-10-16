import { readFile } from 'fs/promises'
import { NextResponse } from 'next/server'
import { join } from 'path'

export async function GET() {
  try {
    const meetingsFile = join(process.cwd(), 'data', 'meetings.json')
    
    try {
      const data = await readFile(meetingsFile, 'utf-8')
      const meetings = JSON.parse(data)
      
      return NextResponse.json({ meetings })
    } catch (error) {
      // File doesn't exist yet, return empty array
      return NextResponse.json({ meetings: [] })
    }
  } catch (error) {
    console.error('Error fetching meetings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    )
  }
}
