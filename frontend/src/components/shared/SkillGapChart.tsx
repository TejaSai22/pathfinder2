import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Legend, 
  ResponsiveContainer,
  Tooltip
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SkillGapAnalysis } from '@/lib/api'

interface SkillGapChartProps {
  data: SkillGapAnalysis
  title?: string
  showDetails?: boolean
}

export function SkillGapChart({ data, title = "Skill Gap Analysis", showDetails = true }: SkillGapChartProps) {
  const radarData = data.radar_data.map(item => ({
    skill: item.skill.length > 12 ? item.skill.substring(0, 12) + '...' : item.skill,
    fullSkill: item.skill,
    "Your Skills": item.candidate * 100,
    "Required": item.required * 100,
    is_technical: item.is_technical,
    matched: item.matched
  }))

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>Compare your skills with job requirements</CardDescription>
          </div>
          <div className="flex flex-col items-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${
              data.overall_score >= 80 ? 'bg-green-500' :
              data.overall_score >= 60 ? 'bg-yellow-500' :
              data.overall_score >= 40 ? 'bg-orange-500' : 'bg-red-500'
            }`}>
              {data.overall_score}%
            </div>
            <span className="text-xs text-muted-foreground mt-1">Overall Match</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid />
              <PolarAngleAxis 
                dataKey="skill" 
                tick={{ fontSize: 10 }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tick={{ fontSize: 10 }}
              />
              <Radar
                name="Your Skills"
                dataKey="Your Skills"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Radar
                name="Required"
                dataKey="Required"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [`${value}%`, name]}
                labelFormatter={(label) => {
                  const item = radarData.find(d => d.skill === label)
                  return item?.fullSkill || label
                }}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {showDetails && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-900">Technical Skills</div>
                <div className="text-2xl font-bold text-blue-600">{data.technical_score}%</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-sm font-medium text-purple-900">Soft Skills</div>
                <div className="text-2xl font-bold text-purple-600">{data.soft_score}%</div>
              </div>
            </div>

            {data.matched_technical.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-green-700">Matching Technical Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {data.matched_technical.map(skill => (
                    <Badge key={skill} variant="success" className="text-xs">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}

            {data.matched_soft.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-green-700">Matching Soft Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {data.matched_soft.map(skill => (
                    <Badge key={skill} className="text-xs bg-green-100 text-green-800">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}

            {data.missing_technical.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-red-700">Missing Technical Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {data.missing_technical.map(skill => (
                    <Badge key={skill} variant="destructive" className="text-xs">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}

            {data.missing_soft.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-orange-700">Missing Soft Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {data.missing_soft.map(skill => (
                    <Badge key={skill} className="text-xs bg-orange-100 text-orange-800">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
