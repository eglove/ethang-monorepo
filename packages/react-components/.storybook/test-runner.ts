import {getStoryContext, TestRunnerConfig} from '@storybook/test-runner';
import { injectAxe, checkA11y } from 'axe-playwright';

const config: TestRunnerConfig = {
    async preVisit(page) {
        await injectAxe(page);
    },
    async postVisit(page, context) {
        // Get the entire context of a story, including parameters, args, argTypes, etc.
        const storyContext = await getStoryContext(page, context);

        if (storyContext.parameters?.a11y?.disable !== true) {
            await checkA11y(page, '#storybook-root', {
                verbose: false,
                detailedReport: true,
                detailedReportOptions: {
                    html: true,
                },
            });
        }
    },
};

export default config;