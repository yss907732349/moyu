<script lang="ts">
import { applyVisualModeChrome, getVisualMode } from "./services/visual-mode";

export default {
  onLaunch() {
    applyVisualModeChrome(getVisualMode());
  },
  onShow() {
    applyVisualModeChrome(getVisualMode());
  }
};
</script>

<style>
@import "./styles/visual-system.css";

page {
  background: #f5efe4;
  color: #25211b;
}
</style>
