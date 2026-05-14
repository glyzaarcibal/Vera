
import sys

filepath = r"c:\Users\glena\risa\project1\Vera\frontend\src\pages\Activities\WeeklyWellnessReport.jsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Sleep Line Chart
old_line_block = """              <div style={styles.chartWrapper}>
                <div style={styles.chartContainer}>
                  <LineChart
                    width={800}
                    height={300}
                    data={sleepChartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    onClick={handleDataPointClick}
                  >
                    <XAxis dataKey="date" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Line
                      type="monotone"
                      dataKey="duration"
                      stroke="#667eea"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                    <Tooltip />
                  </LineChart>
                </div>
              </div>"""

new_line_block = """              <div style={{ ...styles.chartWrapper, height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={sleepChartData}
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    onClick={handleDataPointClick}
                  >
                    <XAxis dataKey="date" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Line
                      type="monotone"
                      dataKey="duration"
                      stroke="#667eea"
                      strokeWidth={3}
                      activeDot={{ r: 8 }}
                    />
                    <Tooltip />
                  </LineChart>
                </ResponsiveContainer>
              </div>"""

content = content.replace(old_line_block, new_line_block)

# 2. Update Breathing Bar Chart
old_bar_block = """              <div style={styles.chartWrapper}>
                <div style={styles.chartContainer}>
                  <BarChart
                    width={800}
                    height={300}
                    data={breathingChartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="date" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Bar dataKey="sessions" fill="#667eea" />
                    <Tooltip />
                  </BarChart>
                </div>
              </div>"""

new_bar_block = """              <div style={{ ...styles.chartWrapper, height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={breathingChartData}
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <XAxis dataKey="date" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Bar dataKey="sessions" fill="#667eea" radius={[4, 4, 0, 0]} />
                    <Tooltip />
                  </BarChart>
                </ResponsiveContainer>
              </div>"""

content = content.replace(old_bar_block, new_bar_block)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Status: Charts updated")
