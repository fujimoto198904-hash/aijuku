/**
 * 全73章の静的集約。Nodeスクリプト(検査・生成)とサーバー側だけが使う。
 * クライアントコンポーネントからimportしない(初回バンドルへ全本文が入るため)。
 * クライアントは lib/textbook-lessons/loader.ts の章単位動的importを使う。
 */

import { chapter as common_01 } from './common/chapter-01';
import { chapter as common_02 } from './common/chapter-02';
import { chapter as common_03 } from './common/chapter-03';
import { chapter as common_04 } from './common/chapter-04';
import { chapter as common_05 } from './common/chapter-05';
import { chapter as common_06 } from './common/chapter-06';
import { chapter as common_07 } from './common/chapter-07';
import { chapter as common_08 } from './common/chapter-08';
import { chapter as common_09 } from './common/chapter-09';
import { chapter as common_10 } from './common/chapter-10';
import { chapter as common_11 } from './common/chapter-11';
import { chapter as common_12 } from './common/chapter-12';
import { chapter as common_13 } from './common/chapter-13';
import { chapter as common_14 } from './common/chapter-14';
import { chapter as common_15 } from './common/chapter-15';
import { chapter as common_16 } from './common/chapter-16';
import { chapter as common_17 } from './common/chapter-17';
import { chapter as common_18 } from './common/chapter-18';
import { chapter as common_19 } from './common/chapter-19';
import { chapter as common_20 } from './common/chapter-20';
import { chapter as department_mgt } from './department/mgt';
import { chapter as department_biz } from './department/biz';
import { chapter as department_sls } from './department/sls';
import { chapter as department_rev } from './department/rev';
import { chapter as department_mkt } from './department/mkt';
import { chapter as department_com } from './department/com';
import { chapter as department_cs } from './department/cs';
import { chapter as department_fin } from './department/fin';
import { chapter as department_hr } from './department/hr';
import { chapter as department_lab } from './department/lab';
import { chapter as department_adm } from './department/adm';
import { chapter as department_leg } from './department/leg';
import { chapter as department_prc } from './department/prc';
import { chapter as department_pd } from './department/pd';
import { chapter as department_it } from './department/it';
import { chapter as department_mfg } from './department/mfg';
import { chapter as department_qa } from './department/qa';
import { chapter as department_scm } from './department/scm';
import { chapter as department_crt } from './department/crt';
import { chapter as department_pmo } from './department/pmo';
import { chapter as industry_rtl } from './industry/rtl';
import { chapter as industry_fnb } from './industry/fnb';
import { chapter as industry_sal } from './industry/sal';
import { chapter as industry_hsp } from './industry/hsp';
import { chapter as industry_trv } from './industry/trv';
import { chapter as industry_con } from './industry/con';
import { chapter as industry_rea } from './industry/rea';
import { chapter as industry_mfd } from './industry/mfd';
import { chapter as industry_prf } from './industry/prf';
import { chapter as industry_edu } from './industry/edu';
import { chapter as generation_bok } from './generation/bok';
import { chapter as generation_nov } from './generation/nov';
import { chapter as generation_pct } from './generation/pct';
import { chapter as generation_mng } from './generation/mng';
import { chapter as generation_blg } from './generation/blg';
import { chapter as generation_nws } from './generation/nws';
import { chapter as generation_rpt } from './generation/rpt';
import { chapter as generation_igc } from './generation/igc';
import { chapter as generation_sns } from './generation/sns';
import { chapter as generation_ytb } from './generation/ytb';
import { chapter as generation_svd } from './generation/svd';
import { chapter as generation_pod } from './generation/pod';
import { chapter as generation_mus } from './generation/mus';
import { chapter as generation_img } from './generation/img';
import { chapter as generation_cat } from './generation/cat';
import { chapter as generation_brd } from './generation/brd';
import { chapter as generation_web } from './generation/web';
import { chapter as generation_ads } from './generation/ads';
import { chapter as generation_sld } from './generation/sld';
import { chapter as generation_crs } from './generation/crs';
import { chapter as generation_gam } from './generation/gam';
import { chapter as generation_app } from './generation/app';
import { chapter as generation_xls } from './generation/xls';

import type { TextbookChapter, TextbookLesson } from './types';

export const allChapters: readonly TextbookChapter[] = [
  common_01,
  common_02,
  common_03,
  common_04,
  common_05,
  common_06,
  common_07,
  common_08,
  common_09,
  common_10,
  common_11,
  common_12,
  common_13,
  common_14,
  common_15,
  common_16,
  common_17,
  common_18,
  common_19,
  common_20,
  department_mgt,
  department_biz,
  department_sls,
  department_rev,
  department_mkt,
  department_com,
  department_cs,
  department_fin,
  department_hr,
  department_lab,
  department_adm,
  department_leg,
  department_prc,
  department_pd,
  department_it,
  department_mfg,
  department_qa,
  department_scm,
  department_crt,
  department_pmo,
  industry_rtl,
  industry_fnb,
  industry_sal,
  industry_hsp,
  industry_trv,
  industry_con,
  industry_rea,
  industry_mfd,
  industry_prf,
  industry_edu,
  generation_bok,
  generation_nov,
  generation_pct,
  generation_mng,
  generation_blg,
  generation_nws,
  generation_rpt,
  generation_igc,
  generation_sns,
  generation_ytb,
  generation_svd,
  generation_pod,
  generation_mus,
  generation_img,
  generation_cat,
  generation_brd,
  generation_web,
  generation_ads,
  generation_sld,
  generation_crs,
  generation_gam,
  generation_app,
  generation_xls,
];

export const allLessons: Readonly<Record<string, TextbookLesson>> =
  Object.fromEntries(
    allChapters.flatMap((chapter) => Object.entries(chapter.lessons)),
  );
