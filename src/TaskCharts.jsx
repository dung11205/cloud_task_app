
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function TaskCharts({
  counts,
  dark,
  compact = true,
}) {
  const data = [
    {
      name: "Chưa làm",
      value: counts.todo,
      color: "#efb45e",
    },
    {
      name: "Đang làm",
      value: counts.in_progress,
      color: "#9b7ce9",
    },
    {
      name: "Hoàn thành",
      value: counts.done,
      color: "#43c69a",
    },
  ];

  const total = counts.all;

  const percent = total
    ? Math.round((counts.done / total) * 100)
    : 0;

  const pieData = total
    ? data.filter((item) => item.value > 0)
    : [
        {
          name: "Chưa có công việc",
          value: 1,
          color: dark ? "#41415c" : "#e4dff5",
        },
      ];

  const textColor = dark
    ? "#b0b3ce"
    : "#646582";

  const tooltipStyle = {
    background: dark ? "#252944" : "#ffffff",
    border: dark
      ? "1px solid #ffffff20"
      : "1px solid #e4dff5",
    borderRadius: "12px",
    color: dark ? "#ffffff" : "#252444",
    boxShadow: "0 8px 25px #00000015",
    fontSize: "12px",
  };

  const tooltipProps = {
    contentStyle: tooltipStyle,
    itemStyle: {
      color: dark ? "#ffffff" : "#252444",
    },
    formatter: (value) => [
      `${value} công việc`,
      "Số lượng",
    ],
  };

  return (
    <section
      className={`analytics-section ${
        compact
          ? "analytics-compact"
          : "analytics-full"
      }`}
    >
      {!compact && (
        <div className="analytics-header">
          <div>
            <span className="analytics-eyebrow">
              ✦ WORKSPACE ANALYTICS
            </span>

            <h2>Phân tích công việc</h2>

            <p>
              Theo dõi hiệu suất và tiến độ
              làm việc của bạn.
            </p>
          </div>

          <span className="analytics-live">
            <span className="status-dot" />
            Dữ liệu trực tuyến
          </span>
        </div>
      )}

      <div className="analytics-grid">

        {/* BIỂU ĐỒ TRÒN */}

        <article className="chart-card">
          <div className="chart-heading">
            <div>
              <h3>Tiến độ công việc</h3>
              <p>Phân bố theo trạng thái</p>
            </div>

            <span className="chart-icon">
              ◉
            </span>
          </div>

          <div className="donut-layout">
            <div className="donut-container">
              <ResponsiveContainer
                width="100%"
                height={compact ? 160 : 250}
              >
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="65%"
                    outerRadius="90%"
                    paddingAngle={total ? 4 : 0}
                    cornerRadius={6}
                    stroke="none"
                    animationDuration={650}
                  >
                    {pieData.map((item) => (
                      <Cell
                        key={item.name}
                        fill={item.color}
                      />
                    ))}
                  </Pie>

                  {total > 0 && (
                    <Tooltip {...tooltipProps} />
                  )}
                </PieChart>
              </ResponsiveContainer>

              <div className="donut-center">
                <strong>{percent}%</strong>
                <span>Hoàn thành</span>
              </div>
            </div>

            <div className="chart-legend">
              {data.map((item) => (
                <div
                  className="legend-row"
                  key={item.name}
                >
                  <span
                    className="legend-dot"
                    style={{
                      background: item.color,
                    }}
                  />

                  <span className="legend-name">
                    {item.name}
                  </span>

                  <span className="legend-value">
                    {item.value}
                  </span>

                  <strong>
                    {total
                      ? Math.round(
                          (item.value / total) * 100
                        )
                      : 0}
                    %
                  </strong>
                </div>
              ))}

              <div className="legend-total">
                <span>Tổng công việc</span>
                <strong>{total}</strong>
              </div>
            </div>
          </div>
        </article>

        {/* BIỂU ĐỒ CỘT */}

        <article className="chart-card">
          <div className="chart-heading">
            <div>
              <h3>Thống kê số lượng</h3>
              <p>Công việc theo trạng thái</p>
            </div>

            <span className="chart-icon">
              ▥
            </span>
          </div>

          <div className="bar-container">
            <ResponsiveContainer
              width="100%"
              height={compact ? 170 : 270}
            >
              <BarChart
                data={data}
                margin={{
                  top: 12,
                  right: 8,
                  left: -22,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke={
                    dark
                      ? "#ffffff15"
                      : "#b9afd540"
                  }
                />

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: textColor,
                    fontSize: 11,
                  }}
                />

                <YAxis
                  allowDecimals={false}
                  domain={[
                    0,
                    (max) => Math.max(1, max),
                  ]}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: textColor,
                    fontSize: 11,
                  }}
                />

                <Tooltip
                  {...tooltipProps}
                  cursor={{
                    fill: "#9b7ce915",
                  }}
                />

                <Bar
                  dataKey="value"
                  radius={[7, 7, 0, 0]}
                  maxBarSize={compact ? 42 : 65}
                  animationDuration={650}
                >
                  {data.map((item) => (
                    <Cell
                      key={item.name}
                      fill={item.color}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {!compact && (
            <div className="chart-summary">
              <div>
                <span>Tỷ lệ hoàn thành</span>
                <strong>{percent}%</strong>
              </div>

              <div className="chart-summary-icon">
                ↗
              </div>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
