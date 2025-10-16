import { readFile } from 'fs/promises'
import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const meetingsFile = join(process.cwd(), 'data', 'meetings.json')
    
    try {
      const data = await readFile(meetingsFile, 'utf-8')
      const meetings = JSON.parse(data)
      const meeting = meetings.find((m: any) => m.id === params.id)
      
      if (!meeting) {
        return NextResponse.json(
          { error: 'Meeting not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({ meeting })
    } catch (error) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Error fetching meeting:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meeting' },
      { status: 500 }
    )
  }
}
