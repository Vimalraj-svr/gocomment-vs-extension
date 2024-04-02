const vscode = require("vscode");
const axios = require("axios");
const CommentsTreeDataProvider = require("./CommentsTreeDataProvider");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  let quickPick;
  let commentsTreeDataProvider = new CommentsTreeDataProvider([]);
  vscode.window.registerTreeDataProvider('commentsTreeView', commentsTreeDataProvider);
  let disposable1 = vscode.commands.registerCommand(
    "linewise.showUI",
    function () {
      quickPick = vscode.window.createQuickPick();
      quickPick.placeholder = "Select an action";

      const items = [
        { label: "Generate Comments", action: "generateComments" },
        { label: "View Vulnerabilities", action: "viewVulnerabilities" },
      ];

      quickPick.items = items;
      quickPick.show();

      quickPick.onDidChangeSelection((selection) => {
        if (selection && selection[0]) {
          const selectedItem = selection[0];
          if (selectedItem.action === "generateComments") {
            vscode.commands.executeCommand("linewise.generateComments");
          } else if (selectedItem.action === "viewVulnerabilities") {
            vscode.commands.executeCommand("linewise.viewVuls");
          }
        }
      });
    }
  );

  let disposable2 = vscode.commands.registerCommand(
    "linewise.generateComments",
    async function () {
      const editor = vscode.window.activeTextEditor;
      const language = getLanguageOfSnippet(editor);
      if (language) {
        console.log("Language of snippet:", language);
      } else {
        console.log("Unable to determine the language of the snippet.");
      }
      if (!editor) {
        vscode.window.showErrorMessage("No active editor!");
        return;
      }
      const selectedText = editor.document.getText(editor.selection);
      if (!selectedText) {
        vscode.window.showErrorMessage("No text selected!");
        return;
      }
      if (selectedText.length >= 6000) {
        vscode.window.showErrorMessage("Select smaller content");
        return;
      } else {
        vscode.window.showInformationMessage(
          `Generating comments for the snippet!`
        );

        try {
          quickPick.hide();
          const response = await axios.post(
            "https://gocomment-backend.onrender.com/getcomments",
            { snippet: selectedText }
          );
          quickPick.hide();
          const responseData = JSON.parse(response.data.response);

          const comments = responseData.comments.replaceAll(". ", ".\n");

          vscode.window.showInformationMessage(
            "Comments generated successfully!"
          );

          const commentText = [comments].join("\n");
          const newComment = generateMultilineComment(
            language,
            selectedText,
            commentText
          );

          editor.edit((editBuilder) => {
            editBuilder.replace(editor.selection, newComment);
          });
        } catch (error) {
          vscode.window.showErrorMessage(
            "Error generating comments: " +
              error.message +
              "\n" +
              "please try again in 1 minute"
          );
        }
      }
    }
  );

  let disposable3 = vscode.commands.registerCommand(
    "linewise.viewVuls",
    async function () {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor!");
        return;
      }
      const selectedText = editor.document.getText(editor.selection);
      if (!selectedText) {
        vscode.window.showErrorMessage("No text selected!");
        return;
      }
      if (selectedText.length >= 6000) {
        vscode.window.showErrorMessage("Select smaller content");
        return;
      } else {

        vscode.window.showInformationMessage(
          `Checking for vulnerabilities!`
        );

        try {
          quickPick.hide();
          const response = await axios.post(
            "https://gocomment-backend.onrender.com/getvulnerabilities",
            { snippet: selectedText }
          );
          const responseData = JSON.parse(response.data.response);
          const vulnerabilities = responseData.vulnerabilities;

          const panel = vscode.window.createWebviewPanel(
            "vulnerabilities",
            "Vulnerabilities",
            vscode.ViewColumn.Two,
            {
              enableScripts: true,
            }
          );

          const htmlContent = `
                    <html>
                    <head>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                padding: 20px;
                            }
                        </style>
                    </head>
                    <body>
                        <h1>Vulnerabilities</h1>
                        <ul>
                            ${vulnerabilities
                              .map((vuln) => `<li>${vuln}</li>`)
                              .join("")}
                        </ul>
                    </body>
                    </html>
                `;

          panel.webview.html = htmlContent;
        } catch (error) {
          vscode.window.showErrorMessage(
            "Error generating comments: " +
              error.message +
              "\n" +
              "please try again in 1 minute"
          );
        }
      }
    }
  );

  context.subscriptions.push(disposable1, disposable2, disposable3);
}

/**
 * Generates multiline comment for the selected code snippet
 * @param {string} codeSnippet The selected code snippet
 * @param {string} commentText The generated comment text
 * @returns {string} Multiline comment with generated comment text
 */
function generateMultilineComment(language, codeSnippet, commentText) {
  switch (language.toLowerCase()) {
    case "javascript":
      return `/*\n${commentText}\n*/\n${codeSnippet}`;
    case "python":
      return `"""\n${commentText}\n"""\n${codeSnippet}`;
    case "java":
      return `/*\n${commentText}\n*/\n${codeSnippet}`;
    case "c":
    case "c++":
      return `/*\n${commentText}\n*/\n${codeSnippet}`;
    case "c#":
      return `/*\n${commentText}\n*/\n${codeSnippet}`;
    case "html":
    case "xml":
      return `<!--\n${commentText}\n-->\n${codeSnippet}`;
    case "css":
      return `/*\n${commentText}\n*/\n${codeSnippet}`;
    case "php":
      return `/*\n${commentText}\n*/\n${codeSnippet}`;
    case "ruby":
      return `=begin\n${commentText}\n=end\n${codeSnippet}`;
    case "swift":
      return `/*\n${commentText}\n*/\n${codeSnippet}`;
    default:
      return `/*\n${commentText}\n*/\n${codeSnippet}`;
  }
}

function getLanguageOfSnippet(editor) {
  if (!editor) {
    return null;
  }

  const document = editor.document;
  if (!document) {
    return null;
  }

  const languageId = document.languageId;
  return languageId;
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
