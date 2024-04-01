const vscode = require('vscode');

class CommentsTreeDataProvider {
  getTreeItem(element) {
    return element;
  }

  getChildren(element) {
    if (!element) {
      const usageInstructionsLines = [
        'Usage Instructions',
        '1. Select a code snippet.',
        `2. Click 'ctrl + K'`,
        '3. Select any of the inputs from the command palette',
        `4. Don't unselect the snippet`,
        '5. Wait for the AI to generate comments'
      ];

      const usageInstructionsItems = usageInstructionsLines.map(line => {
        const item = new vscode.TreeItem(line, vscode.TreeItemCollapsibleState.None);
        item.contextValue = 'usageInstruction';
        return item;
      });

      return Promise.resolve(usageInstructionsItems);
    }
    return Promise.resolve([]);
  }
}

module.exports = CommentsTreeDataProvider;
