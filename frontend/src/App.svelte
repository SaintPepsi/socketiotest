<script>
  import { uiState } from './uiStateStore';
  import { joinGame, initCanvas } from './socket';
  import { onMount } from 'svelte';

  let state = '';
  uiState.subscribe((val) => {
    state = val;
  });

  onMount(initCanvas);
</script>

<main>
  {#if state === 'new'}
    <div on:click={joinGame}>join game</div>
  {:else if state === 'loading'}
    loading
  {/if}

  <canvas id="main-canvas" />
</main>

<style>
</style>
