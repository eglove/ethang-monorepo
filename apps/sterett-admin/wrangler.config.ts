import { defineWranglerConfig } from "wrangler/experimental-config";

export default defineWranglerConfig({
	dev: {
		types: {
			generate: false,
		},
	},
	assetsDirectory: "./dist",
});
