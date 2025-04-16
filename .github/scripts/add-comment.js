module.exports = async ({ github, context, core, comment }) => {
    try {
        if (!comment) {
            core.setFailed("Comment content is required");
            return;
        }

        const issueNumber = context.issue.number;
        const owner = context.repo.owner;
        const repo = context.repo.repo;

        await github.rest.issues.createComment({
            owner,
            repo,
            issue_number: issueNumber,
            body: comment,
        });
    } catch (error) {
        core.setFailed(error.message);
    }
}; 