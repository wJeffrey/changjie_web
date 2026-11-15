import site from '@/data/site.json';

export default function ConfiguratorMarkup() {
  return (
    <>
<main id="main" className="container">
  <div className="cfg-title">
    <h1>风管选型配置器</h1>
    <p>选好产品系列、截面尺寸、板厚和外表面颜色，左侧的风管会立即按比例重画；配套的铝箔伸缩软管可选内径、颜色和数量。可以拖动旋转查看，配置清单可复制后发给我们报价。</p>
  </div>

  <div className="cfg">
    <div className="stage-wrap">
      <div className="stage">
        <canvas id="cv" tabIndex="0" role="img" aria-label="风管三维预览，可拖动或用方向键旋转"></canvas>
        <canvas id="cvHose" hidden tabIndex="0" role="img" aria-label="软管三维预览，可拖动或用方向键旋转"></canvas>
        <div className="stage-tools" role="group" aria-label="视图">
          <button className="chip" data-view="iso">等轴</button>
          <button className="chip" data-view="end">端面</button>
          <button className="chip" data-view="side">侧面</button>
          <button className="chip" id="tDims" aria-pressed="true">尺寸标注</button>
          <button className="chip" id="tFl" aria-pressed="true">法兰</button>
        </div>
        <div className="stage-hint">拖动旋转</div>
        <div className="titleblock">
          <div><small>当前配置</small><b id="tbName"></b></div>
          <div><small id="tbLabel">内净尺寸 W×H×L（mm）</small><span className="num" id="tbSize"></span></div>
        </div>
      </div>
    </div>

    <div className="panel">
      <section className="group">
        <h2>产品系列</h2>
        <div className="lines" id="lines" role="radiogroup" aria-label="产品系列"></div>
      </section>
      <section className="group">
        <h2>尺寸<span>按内净尺寸，单位 mm</span></h2>
        <div className="dim" id="rowW"><label htmlFor="nW">宽 W</label><input type="range" id="rW" min="200" max="3000" step="10" aria-label="宽度滑块" /><div className="box"><input type="number" id="nW" min="200" max="3000" step="10" inputMode="numeric" /><span>mm</span></div></div>
        <div className="dim" id="rowH"><label htmlFor="nH">高 H</label><input type="range" id="rH" min="150" max="2000" step="10" aria-label="高度滑块" /><div className="box"><input type="number" id="nH" min="150" max="2000" step="10" inputMode="numeric" /><span>mm</span></div></div>
        <div className="dim"><label htmlFor="nL">长 L</label><input type="range" id="rL" min="500" max="4000" step="50" aria-label="长度滑块" /><div className="box"><input type="number" id="nL" min="500" max="4000" step="50" inputMode="numeric" /><span>mm</span></div></div>
        <div className="warn" id="warn" hidden></div>
      </section>
      <section className="group" id="hoseGroup" hidden>
        <h2>软管规格<span>常用内径，单位 mm</span></h2>
        <div className="seg" id="hoseD" role="radiogroup" aria-label="内径"></div>
        <h2 className="sub">弯曲示意<span>只影响预览</span></h2>
        <div className="seg" id="hoseBend" role="radiogroup" aria-label="弯曲角度"></div>
        <h2 className="sub">数量</h2>
        <div className="dim"><label htmlFor="nQ">数量</label><input type="range" id="rQ" min="1" max="200" step="1" aria-label="数量滑块" /><div className="box"><input type="number" id="nQ" min="1" max="2000" step="1" inputMode="numeric" /><span>根</span></div></div>
        <p className="note">单根长度约 6 m（可伸缩），其他内径和工作温度等参数请来电确认。</p>
      </section>
      <section className="group" id="varGroup">
        <h2 id="varTitle">板厚</h2>
        <div className="seg" id="variants" role="radiogroup" aria-labelledby="varTitle"></div>
        <p className="note" id="varNote"></p>
      </section>
      <section className="group" id="colorGroup">
        <h2 id="colH">外表面颜色<span>彩钢板</span></h2>
        <div className="sw" id="colors" role="radiogroup" aria-label="外表面颜色"></div>
        <p className="note" id="colNote">屏幕颜色仅作示意，实际以彩钢板色卡和样板为准。</p>
      </section>
      <section className="group">
        <h2>设计风速<span>用于估算风量</span></h2>
        <div className="dim"><label htmlFor="nV">风速</label><input type="range" id="rV" min="2" max="20" step="0.5" aria-label="风速滑块" /><div className="box"><input type="number" id="nV" min="2" max="20" step="0.5" inputMode="decimal" /><span>m/s</span></div></div>
      </section>
      <section className="group">
        <h2>配置清单</h2>
        <table className="sheet"><tbody id="sheet"></tbody></table>
        <div className="actions">
          <button className="btn btn-primary" id="dlXlsx">下载 Excel 清单</button>
          <button className="btn btn-primary" id="dlDocx">下载 Word 清单</button>
          <button className="btn btn-line" id="copy">复制配置清单</button>
          <a className="btn btn-line" href={`tel:${site.tel}`}>电话询价</a>
        </div>
        <p className="note">清单中的性能数据取自各系列产品技术参数表；板厚、颜色为常用选项，最终规格以技术确认和合同为准。</p>
      </section>
    </div>
  </div>
</main>
    </>
  );
}
