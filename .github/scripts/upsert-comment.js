module.exports = async ({ github, context, core, comment, commentIdentifier }) => {
    try {
        if (!comment) {
            core.setFailed("Comment content is required");
            return;
        }

        if (!commentIdentifier) {
            core.setFailed("Comment identifier is required");
            return;
        }

        const issueNumber = context.issue.number;
        const owner = context.repo.owner;
        const repo = context.repo.repo;

        // Find existing comment from this action
        const { data: comments } = await github.rest.issues.listComments({
            owner,
            repo,
            issue_number: issueNumber,
        });

        const existingComment = comments.find(
            (comment) =>
                comment.user.login === "github-actions[bot]" &&
                comment.body.includes(commentIdentifier),
        );

        if (existingComment) {
            await github.rest.issues.updateComment({
                owner,
                repo,
                comment_id: existingComment.id,
                body: comment,
            });
        } else {
            await github.rest.issues.createComment({
                owner,
                repo,
                issue_number: issueNumber,
                body: comment,
            });
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}; 