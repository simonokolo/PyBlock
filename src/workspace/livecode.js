export class LiveCode {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.setupViewport();
    this.setupEventListeners();
    this.switchTabs('translation');
  }

  setupViewport() {
    this.container.outerHTML = `
        <section id="livecode">
          <div id="livecode-inner">
            <header>
              <div id="tab-buttons">
                <button class="nav-tab" id="tab1-button">main.py</button>
                <button class="nav-tab" id="tab2-button">OUTPUT</button>
              </div>
            </header>
            <div id="tab-content">
              <article id="translation">
                <div id="translation-content"></div>
              </article>
              <article id="output">Tab2</article>
            </div>
          </div>
        </section>
    `;

    this.translationTab = document.getElementById('translation') 
    this.translationTabButton = document.getElementById('tab1-button')

    this.outputTab = document.getElementById('output')
    this.outputTabButton = document.getElementById('tab2-button')
  }
  // Logic to switch between tabs
  switchTabs(tab) {
    // Show the selected tab content and update button
    if (tab === 'translation') {
      this.translationTab.style.display = 'block';
      this.translationTab.classList.add('active');
      this.translationTabButton.style.backgroundColor = '#16161B';

      this.outputTab.style.display = 'none';
      this.outputTab.classList.remove('active')
      this.outputTabButton.style.backgroundColor = '#2C3138';
    } else if (tab === 'output') {
      this.translationTab.style.display = 'none';
      this.translationTab.classList.remove('active')
      this.translationTabButton.style.backgroundColor = '#2C3138';

      this.outputTab.style.display = 'block';
      this.outputTab.classList.add('active')
      this.outputTabButton.style.backgroundColor = '#16161B';
    }
  }

  setupEventListeners() {
    // Handle tab button clicks
    document.querySelectorAll('.nav-tab').forEach((button, index) => {
      button.addEventListener('click', () => {
        const tab = index === 0 ? 'translation' : 'output';
        // Switch to the selected tab
        this.switchTabs(tab);
      });
    });
  }

  updateLiveCodeTranslation(pythonCode) {
    pythonCode = pythonCode.split("\n");
    // Loop through each statement
    for (let statement in pythonCode) {
      // Create a new div for the statement
      const newDiv = document.createElement("div");
      newDiv.innerHTML = pythonCode[statement];
      newDiv.classList.add("code-line");
      document.getElementById('translation-content').appendChild(newDiv);
    };
  }

  updateOutput(output) {
    this.outputTab.innerHTML = output.replace(/\n/g, "<br>");
  }
}
