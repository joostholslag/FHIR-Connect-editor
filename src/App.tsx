import React, { useState } from "react";
import MonacoEditor from "@monaco-editor/react";
import Ajv from "ajv";
import modelSchema from "./model-mapping.schema.json";
import Form from "@rjsf/core";

const ajv = new Ajv({ allErrors: true, strict: false });

type Mode = "editor" | "form";

export default function App() {
  const [json, setJson] = useState("{}");
  const [errors, setErrors] = useState<string[]>([]);
  const [valid, setValid] = useState<boolean | null>(null);
  const [mode, setMode] = useState<Mode>("editor");

  function handleEditorChange(value?: string) {
    setJson(value || "");
    setValid(null);
    setErrors([]);
  }

  function handleValidate(raw?: string) {
    try {
      const data = JSON.parse(raw ?? json);
      const validate = ajv.compile(modelSchema);
      const valid = validate(data);
      setValid(valid as boolean);
      setErrors(
        !valid && validate.errors
          ? validate.errors.map((e) => `${e.instancePath} ${e.message}`)
          : []
      );
    } catch (e: any) {
      setValid(false);
      setErrors([e.message]);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setJson(evt.target?.result as string);
      setValid(null);
      setErrors([]);
    };
    reader.readAsText(file);
  }

  function handleDownload() {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "model.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFormChange({ formData }: { formData: any }) {
    setJson(JSON.stringify(formData, null, 2));
    setValid(null);
    setErrors([]);
  }

  function handleFormValidate(formData: any, errors: any) {
    // You can add custom validation here if needed
    return errors;
  }

  let formData: any = {};
  try {
    formData = JSON.parse(json);
  } catch {
    // invalid JSON, use default empty object
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1>FHIRConnect Model JSON Editor & Validator</h1>
      <div style={{ marginBottom: 12 }}>
        <button
          onClick={() => setMode("editor")}
          style={{
            background: mode === "editor" ? "#315fa2" : "#467fcf",
            marginRight: 8,
          }}
        >
          Code Editor
        </button>
        <button
          onClick={() => setMode("form")}
          style={{
            background: mode === "form" ? "#315fa2" : "#467fcf",
          }}
        >
          Form Editor
        </button>
      </div>
      <input type="file" accept="application/json" onChange={handleFileUpload} />
      <button onClick={handleDownload} style={{ marginLeft: 12 }}>
        Download JSON
      </button>
      <div style={{ height: 400, margin: "18px 0" }}>
        {mode === "editor" ? (
          <MonacoEditor
            height="100%"
            defaultLanguage="json"
            value={json}
            onChange={handleEditorChange}
            options={{ minimap: { enabled: false } }}
          />
        ) : (
          <Form
            schema={modelSchema as any}
            formData={formData}
            onChange={handleFormChange}
            validate={handleFormValidate}
            liveValidate={false}
          >
            <div>
              <button type="submit" style={{ marginRight: 8 }}>
                Update JSON
              </button>
            </div>
          </Form>
        )}
      </div>
      <button onClick={() => handleValidate()} disabled={mode === "form" && !formData}>
        Validate Against Schema
      </button>
      {valid !== null && (
        <div style={{ marginTop: 16 }}>
          {valid ? (
            <span style={{ color: "green" }}>✅ Valid JSON!</span>
          ) : (
            <span style={{ color: "red" }}>
              ❌ Invalid JSON
              <ul>
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </span>
          )}
        </div>
      )}
      <p style={{ marginTop: 24 }}>
        <a
          href="https://github.com/SevKohler/FHIRconnect-spec/blob/main/modules/ROOT/attachments/model-mapping.schema.json"
          target="_blank"
        >
          View model-mapping.schema.json in the FHIRconnect-spec repository
        </a>
      </p>
    </div>
  );
}