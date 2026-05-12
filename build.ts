/// <reference types="bun" />

async function build() {
	const { success, logs } = await Bun.build({
		entrypoints: ['src/web-serial/index.ts'],
		outdir: 'dist',
		root: 'src',
		target: 'browser',
		minify: true,
		splitting: true,
	})

	if (!success) {
		console.error('Build failed.')
		for (const log of logs) console.error(log)
		process.exit(1)
	}

	console.info('Build succeeded.')
}

build()
