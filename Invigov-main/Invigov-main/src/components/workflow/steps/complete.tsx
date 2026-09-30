"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";

interface Document {
  id: string;
  document_type: string;
  filename: string;
  file_size_bytes: number;
  generated_at: string;
}

function useGenerateDocuments() {
  return useMutation({
    mutationFn: async () => {
      const res = await api.post("/documents/generate");
      return res.data;
    },
    onError: () => {
      // Error handled by caller via mutateAsync
    },
  });
}

function useDocumentDownload() {
  return useMutation({
    mutationFn: async (documentId: string) => {
      const res = await api.get(`/documents/${documentId}/download`);
      return res.data;
    },
    onSuccess: (data) => {
      window.open(data.download_url, "_blank");
      toast.success("Document download started");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to download document");
    },
  });
}

const documentTypeLabels: Record<string, string> = {
  sam_checklist: "SAM.gov Registration Checklist",
  reps_certs: "FAR/DFARS Representations & Certifications",
  banking_authorization: "Banking Authorization Letter (EFT)",
};

const documentIcons: Record<string, JSX.Element> = {
  sam_checklist: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  reps_certs: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  banking_authorization: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
};

export function Complete() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [generated, setGenerated] = useState(false);

  const generateMutation = useGenerateDocuments();
  const downloadMutation = useDocumentDownload();

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync();
      setDocuments(result.documents || []);
      setGenerated(true);
      toast.success("Documents generated successfully!");
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || "Failed to generate documents";
      toast.error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    }
  };

  const handleDownload = (documentId: string) => {
    downloadMutation.mutate(documentId);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div className="mt-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            Workflow Complete!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your SAM.gov registration workflow has been completed successfully.
          </p>
        </div>
      </div>

      {!generated ? (
        <div className="max-w-md mx-auto space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-900">
              Click the button below to generate your SAM.gov registration documents. You'll receive 3 PDF files ready for submission.
            </p>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              size="lg"
            >
              {generateMutation.isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating documents...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generate Documents
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-green-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-900">Documents generated successfully!</p>
                <p className="text-xs text-green-700 mt-1">
                  Your SAM.gov registration documents are ready to download. Click any document below to download.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <div className="text-blue-600">
                          {documentIcons[doc.document_type]}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {documentTypeLabels[doc.document_type]}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="neutral" className="text-xs">
                            {formatFileSize(doc.file_size_bytes)}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {doc.filename}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleDownload(doc.id)}
                      disabled={downloadMutation.isPending}
                    >
                      <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-900">Next Steps</p>
                <ol className="text-xs text-yellow-700 mt-2 space-y-1 list-decimal list-inside">
                  <li>Download all 3 documents above</li>
                  <li>Visit <a href="https://sam.gov" target="_blank" className="underline font-medium">SAM.gov</a> and create an account</li>
                  <li>Upload the Reps & Certs and Banking Authorization documents</li>
                  <li>Follow the SAM Registration Checklist for step-by-step guidance</li>
                  <li>Submit your registration (approval typically takes 7-10 business days)</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-center pt-4 border-t">
        <Link href="/dashboard">
          <Button variant="secondary">Return to Dashboard</Button>
        </Link>
      </div>

      <p className="text-xs text-gray-500 max-w-2xl mx-auto text-center">
        Your workflow data is now read-only. You can regenerate and download documents at any time.
      </p>
    </div>
  );
}
