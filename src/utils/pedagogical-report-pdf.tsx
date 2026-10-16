"use client";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import type { PedagogicalReportDetail } from "@/services/report.service";
import { formatAverage } from "./formatFunctions";

const analysisLabel = {
  PERFORMANCE: "Desempenho",
  GAPS: "Lacunas",
  BOTH: "Desempenho + Lacunas",
};

const styles = StyleSheet.create({
  page: {
    padding: 32,
    paddingBottom: 48,
    backgroundColor: "#f8fafc",
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  header: {
    backgroundColor: "#2563eb",
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  },
  kicker: {
    color: "#dbeafe",
    fontSize: 9,
    marginBottom: 6,
  },
  title: {
    color: "#ffffff",
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
  },
  meta: {
    color: "#dbeafe",
    fontSize: 10,
    marginTop: 6,
  },
  badge: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#1d4ed8",
    color: "#ffffff",
    fontSize: 9,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metrics: {
    flexDirection: "row",
    marginBottom: 16,
  },
  metric: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    marginRight: 8,
  },
  metricLast: {
    marginRight: 0,
  },
  metricLabel: {
    fontSize: 8,
    color: "#64748b",
  },
  metricValue: {
    fontSize: 18,
    marginTop: 4,
    fontFamily: "Helvetica-Bold",
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  themeRow: {
    marginBottom: 8,
  },
  themeHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  themeName: {
    fontSize: 10,
  },
  themePercent: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  barTrack: {
    height: 6,
    backgroundColor: "#e2e8f0",
    borderRadius: 99,
  },
  barFill: {
    height: 6,
    borderRadius: 99,
  },
  studentBlock: {
    marginBottom: 8,
  },
  studentName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  examRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
    paddingLeft: 8,
  },
  examTitle: {
    fontSize: 10,
    color: "#334155",
  },
  examScore: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  card: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  label: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 2,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.4,
    marginBottom: 8,
  },
  empty: {
    fontSize: 10,
    color: "#64748b",
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 32,
    right: 32,
    fontSize: 8,
    color: "#64748b",
    textAlign: "right",
  },
});

function tone(percent: number) {
  if (percent >= 70) return "#16a34a";
  if (percent >= 50) return "#f59e0b";
  return "#dc2626";
}

function fileName(title: string) {
  const safe = title.replace(/[\\/:*?"<>|]+/g, " ").trim();
  return `${safe || "relatorio"}.pdf`;
}

function ReportDocument({ report }: { report: PedagogicalReportDetail }) {
  const createdAt = new Date(report.createdAt).toLocaleDateString("pt-BR");
  const showPerformance = report.analysisType !== "GAPS";
  const showGaps = report.analysisType !== "PERFORMANCE";
  const themes = report.content.themes ?? [];
  const gaps = report.content.gaps ?? [];

  return (
    <Document title={report.title}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Relatório pedagógico</Text>
          <Text style={styles.title}>{report.title}</Text>
          <Text style={styles.meta}>
            {report.className}: {report.authorName} - {createdAt}
          </Text>
          <Text style={styles.badge}>{analysisLabel[report.analysisType]}</Text>
        </View>

        {showPerformance && (
          <View style={styles.section}>
            <View style={styles.metrics}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>MÉDIA</Text>
                <Text style={styles.metricValue}>
                  {formatAverage(report.content.average, false)}
                </Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>MEDIANA</Text>
                <Text style={styles.metricValue}>
                  {formatAverage(report.content.median, false)}
                </Text>
              </View>
              <View style={[styles.metric, styles.metricLast]}>
                <Text style={styles.metricLabel}>TAXA DE ACERTO</Text>
                <Text style={styles.metricValue}>
                  {report.content?.hitRate ? `${report.content.hitRate}%` : "-"}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Desempenho por tema</Text>
            {themes.length === 0 ? (
              <Text style={styles.empty}>Nenhuma resposta corrigida.</Text>
            ) : (
              themes.map((theme) => {
                const width = `${Math.min(100, Math.max(0, theme.percent))}%`;
                return (
                  <View key={theme.name} style={styles.themeRow}>
                    <View style={styles.themeHead}>
                      <Text style={styles.themeName}>{theme.name}</Text>
                      <Text
                        style={[
                          styles.themePercent,
                          { color: tone(theme.percent) },
                        ]}
                      >
                        {theme.percent}%
                      </Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width,
                            backgroundColor: tone(theme.percent),
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })
            )}

            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>
              Alunos
            </Text>
            {(report.content.students ?? []).length === 0 ? (
              <Text style={styles.empty}>
                Nenhum aluno com prova corrigida.
              </Text>
            ) : (
              report.content.students.map((student) => (
                <View key={student.name} style={styles.studentBlock}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  {student.exams.map((exam) => (
                    <View
                      key={`${student.name}-${exam.title}`}
                      style={styles.examRow}
                    >
                      <Text style={styles.examTitle}>{exam.title}</Text>
                      <Text style={styles.examScore}>
                        {formatAverage(exam.score, false)}
                      </Text>
                    </View>
                  ))}
                </View>
              ))
            )}
          </View>
        )}

        {showGaps && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lacunas</Text>
            {gaps.length === 0 ? (
              <Text style={styles.empty}>Nenhuma lacuna identificada.</Text>
            ) : (
              gaps.map((gap) => (
                <View key={gap.theme} style={styles.card}>
                  <Text style={styles.cardTitle}>
                    {gap.theme} · {gap.percent}% de acerto
                  </Text>
                  <Text style={styles.label}>EVIDÊNCIA</Text>
                  <Text style={styles.body}>{gap.evidence}</Text>
                  <Text style={styles.label}>SUGESTÃO PEDAGÓGICA</Text>
                  <Text style={styles.body}>{gap.suggestion}</Text>
                </View>
              ))
            )}
          </View>
        )}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

export async function downloadPedagogicalReportPdf(
  report: PedagogicalReportDetail,
) {
  const blob = await pdf(<ReportDocument report={report} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName(
    `${report.title} - ${new Date(report.createdAt).toLocaleDateString("pt-BR")}`,
  );
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
