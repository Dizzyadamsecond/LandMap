'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowRight,
  Play,
  Pause,
  Trash2,
  Settings,
  Download,
  Filter,
} from '../../../../../../components/lovable/icons';
import { apiUrl } from '../../../../../lib/api';
