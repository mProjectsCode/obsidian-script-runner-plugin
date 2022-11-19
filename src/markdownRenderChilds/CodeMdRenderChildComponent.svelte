<script lang="ts">
	import {CodeMdRenderChildData} from './AbstractCodeMdRenderChild';
	import {Button, SettingItem} from 'obsidian-svelte';

	export let data: CodeMdRenderChildData;
	export let run: () => Promise<void>;

	function runCode() {
		run();
		data = data;
	}
</script>

<div class="card" style="background: var(--background-secondary)">
	<h3>Script Runner</h3>
	<div>
		<pre class="language-js" tabindex=0><code class="language-js">{data.content}</code></pre>
	</div>
	<div class="script-runner-settings-group">
		<SettingItem
			name="Run"
			description="Run your script">
			<Button on:click={runCode}>Run</Button>
		</SettingItem>
		<div>
			<pre class="language-console"><code>{data.result}</code></pre>
		</div>
	</div>
</div>
