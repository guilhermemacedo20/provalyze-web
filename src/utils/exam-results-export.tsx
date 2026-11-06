"use client";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import type { ExamDetail, ExamResult } from "@/services/exams.service";
import { STUDENT_STATUS } from "@/components/exams/ExamStatusBadge";
import { formatFullPeriod, formatScore } from "@/lib/exam-format";

export type ResultsHeader = {
  title: string;
  classNames: string;
  date: string;
};

export type ResultRow = {
  name: string;
  className: string;
  score: number | null;
  status: string;
};

export function resultsHeader(
  exam: Pick<ExamDetail, "title" | "classes" | "startsAt" | "endsAt">,
  classId?: string,
): ResultsHeader {
  const classes = exam.classes.filter((c) => !classId || c.id === classId);
  return {
    title: exam.title,
    classNames: classes.map((c) => c.name).join(", ") || "Sem turma",
    date: formatFullPeriod(exam.startsAt, exam.endsAt),
  };
}

export function buildResultRows(results: ExamResult[]): ResultRow[] {
  return results.map((result) => ({
    name: result.name,
    className: result.className,
    score: result.score,
    status: STUDENT_STATUS[result.status].label,
  }));
}

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#0f172a",
  },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  meta: { color: "#64748b", marginBottom: 2 },
  table: { marginTop: 16, borderWidth: 1, borderColor: "#e2e8f0" },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  head: { backgroundColor: "#f1f5f9", fontFamily: "Helvetica-Bold" },
  name: { flex: 3 },
  className: { flex: 2 },
  score: { flex: 1 },
  status: { flex: 2 },
});

function ResultsDocument({
  header,
  rows,
}: {
  header: ResultsHeader;
  rows: ResultRow[];
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{header.title}</Text>
        <Text style={styles.meta}>Turma: {header.classNames}</Text>
        <Text style={styles.meta}>Data: {header.date}</Text>

        <View style={styles.table}>
          <View style={[styles.row, styles.head]} fixed>
            <Text style={styles.name}>Nome</Text>
            <Text style={styles.className}>Turma</Text>
            <Text style={styles.score}>Nota</Text>
            <Text style={styles.status}>Status</Text>
          </View>
          {rows.map((row, index) => (
            <View key={index} style={styles.row} wrap={false}>
              <Text style={styles.name}>{row.name}</Text>
              <Text style={styles.className}>{row.className}</Text>
              <Text style={styles.score}>{formatScore(row.score)}</Text>
              <Text style={styles.status}>{row.status}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

function fileName(title: string, extension: string) {
  const safe = title.replace(/[\\/:*?"<>|]+/g, " ").trim();
  return `${safe || "prova"} - resultados.${extension}`;
}

function saveFile(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function downloadExamResultsPdf(
  header: ResultsHeader,
  rows: ResultRow[],
) {
  const blob = await pdf(
    <ResultsDocument header={header} rows={rows} />,
  ).toBlob();
  saveFile(blob, fileName(header.title, "pdf"));
}

export async function downloadExamResultsExcel(
  header: ResultsHeader,
  rows: ResultRow[],
) {
  const excel = await import("exceljs");
  const { Workbook } =
    "default" in excel ? (excel.default as typeof excel) : excel;
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("Resultados");

  sheet.addRow(["Prova", header.title]);
  sheet.addRow(["Turma", header.classNames]);
  sheet.addRow(["Data", header.date]);
  sheet.addRow([]);
  sheet.addRow(["Nome", "Turma", "Nota", "Status"]).font = { bold: true };
  rows.forEach((row) =>
    sheet.addRow([row.name, row.className, row.score ?? "-", row.status]),
  );

  sheet.getColumn(1).width = 40;
  sheet.getColumn(2).width = 18;
  sheet.getColumn(3).width = 10;
  sheet.getColumn(4).width = 24;

  const buffer = await workbook.xlsx.writeBuffer();
  saveFile(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    fileName(header.title, "xlsx"),
  );
}
